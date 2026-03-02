"""LangGraph result-tracking pipeline: settle picks and retrain the calibrator.

State machine:
    fetch_settled_picks -> settle_picks -> retrain_calibrator -> END
"""

from __future__ import annotations

import logging
import operator
from datetime import date, datetime, timezone
from typing import Annotated

import numpy as np
from langgraph.graph import END, StateGraph
from typing_extensions import TypedDict

from app.db import get_pool
from app.ml.confidence_calibrator import ConfidenceCalibrator
from app.redis_client import get_checkpointer

logger = logging.getLogger(__name__)

_calibrator = ConfidenceCalibrator()


# ---------------------------------------------------------------------------
# State
# ---------------------------------------------------------------------------


class ResultTrackingState(TypedDict):
    date: str
    picks_settled: int
    picks_updated: list[dict]
    retrained: bool
    errors: Annotated[list[str], operator.add]


# ---------------------------------------------------------------------------
# Nodes
# ---------------------------------------------------------------------------


async def fetch_settled_picks(state: ResultTrackingState) -> dict:
    """Load picks whose game_time has passed but have no result yet."""
    try:
        pool = await get_pool()
        rows = await pool.fetch(
            """
            SELECT id, event_id, sport, selection, claw_edge,
                   confidence, game_time
            FROM picks
            WHERE is_active = true
              AND game_time < NOW()
              AND result IS NULL
            LIMIT 100
            """,
        )
        return {"picks_updated": [dict(r) for r in rows]}
    except Exception as exc:
        logger.error("fetch_settled_picks failed: %s", exc, exc_info=True)
        return {"picks_updated": [], "errors": [f"fetch_settled_picks: {exc}"]}


async def settle_picks(state: ResultTrackingState) -> dict:
    """Mark each unsettled pick with a result (placeholder until score data arrives)."""
    picks = state.get("picks_updated", [])
    if not picks:
        return {"picks_settled": 0}

    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            async with conn.transaction():
                for p in picks:
                    await conn.execute(
                        """
                        UPDATE picks
                        SET result = 'pending_result',
                            settled_at = $1
                        WHERE id = $2
                        """,
                        datetime.now(timezone.utc),
                        p["id"],
                    )
        return {"picks_settled": len(picks)}
    except Exception as exc:
        logger.error("settle_picks failed: %s", exc, exc_info=True)
        return {"picks_settled": 0, "errors": [f"settle_picks: {exc}"]}


async def retrain_calibrator(state: ResultTrackingState) -> dict:
    """Retrain the confidence calibrator from historical won/lost picks."""
    try:
        pool = await get_pool()
        rows = await pool.fetch(
            """
            SELECT claw_edge, confidence, result
            FROM picks
            WHERE result IN ('won', 'lost')
              AND settled_at IS NOT NULL
            ORDER BY settled_at DESC
            LIMIT 500
            """,
        )

        if len(rows) < 10:
            logger.info("Only %d labelled samples; skipping retrain.", len(rows))
            return {"retrained": False}

        features = np.array(
            [
                [float(r["claw_edge"] or 0), float(r.get("confidence") or 50)]
                for r in rows
            ]
        )
        labels = np.array([1 if r["result"] == "won" else 0 for r in rows])

        success = _calibrator.retrain(features, labels)
        return {"retrained": success}
    except Exception as exc:
        logger.error("retrain_calibrator failed: %s", exc, exc_info=True)
        return {"retrained": False, "errors": [f"retrain_calibrator: {exc}"]}


# ---------------------------------------------------------------------------
# Graph assembly
# ---------------------------------------------------------------------------


def build_result_tracking_graph() -> StateGraph:
    graph = StateGraph(ResultTrackingState)

    graph.add_node("fetch_settled_picks", fetch_settled_picks)
    graph.add_node("settle_picks", settle_picks)
    graph.add_node("retrain_calibrator", retrain_calibrator)

    graph.set_entry_point("fetch_settled_picks")
    graph.add_edge("fetch_settled_picks", "settle_picks")
    graph.add_edge("settle_picks", "retrain_calibrator")
    graph.add_edge("retrain_calibrator", END)

    return graph.compile(checkpointer=get_checkpointer())


result_tracking_graph = build_result_tracking_graph()


async def run_result_tracking(thread_id: str) -> dict:
    """Entry point: invoke the result-tracking pipeline."""
    initial_state: ResultTrackingState = {
        "date": date.today().isoformat(),
        "picks_settled": 0,
        "picks_updated": [],
        "retrained": False,
        "errors": [],
    }
    return await result_tracking_graph.ainvoke(
        initial_state,
        {"configurable": {"thread_id": thread_id}},
    )
