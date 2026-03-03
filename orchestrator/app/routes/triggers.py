"""Trigger endpoints for orchestrator pipelines.

All endpoints verify the ``X-Orchestrator-Key`` header against
``settings.orchestrator_api_key`` before dispatching work.

Routes:
    POST /trigger/picks/{sport}  -- run pick-generation for a sport
    POST /trigger/odds           -- run odds-sync across all sports
    POST /trigger/results        -- run result-tracking / settlement
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Header, HTTPException

from app.config import settings
from app.graphs.odds_sync import run_odds_sync
from app.graphs.pick_generation import run_pick_generation
from app.graphs.result_tracking import run_result_tracking

router = APIRouter(prefix="/trigger", tags=["triggers"])


def _verify_key(key: str | None) -> None:
    """Raise 401 if the orchestrator key is missing or wrong."""
    if not settings.orchestrator_api_key:
        # No key configured -> allow (dev mode)
        return
    if key != settings.orchestrator_api_key:
        raise HTTPException(status_code=401, detail="Invalid orchestrator key")


# ---------------------------------------------------------------------------
# Pick generation
# ---------------------------------------------------------------------------


@router.post("/picks/{sport}")
async def trigger_picks(
    sport: str,
    x_orchestrator_key: str | None = Header(None),
):
    """Kick off pick generation for *sport* (e.g. ``basketball_nba``)."""
    _verify_key(x_orchestrator_key)
    thread_id = f"picks-{sport}-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}-{uuid.uuid4().hex[:8]}"
    result = await run_pick_generation(sport, thread_id)
    return {
        "status": "completed",
        "thread_id": thread_id,
        "sport": sport,
        "picks_count": len(result.get("calibrated_picks", [])),
        "errors": result.get("errors", []),
    }


# ---------------------------------------------------------------------------
# Odds sync
# ---------------------------------------------------------------------------


@router.post("/odds")
async def trigger_odds(
    x_orchestrator_key: str | None = Header(None),
):
    """Run odds synchronisation across all configured sports."""
    _verify_key(x_orchestrator_key)
    thread_id = f"odds-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}-{uuid.uuid4().hex[:8]}"
    result = await run_odds_sync(thread_id)
    return {
        "status": "completed",
        "thread_id": thread_id,
        "events_upserted": result.get("events_upserted", 0),
        "odds_inserted": result.get("odds_inserted", 0),
        "errors": result.get("errors", []),
    }


# ---------------------------------------------------------------------------
# Result tracking
# ---------------------------------------------------------------------------


@router.post("/results")
async def trigger_results(
    x_orchestrator_key: str | None = Header(None),
):
    """Settle picks and optionally retrain the confidence calibrator."""
    _verify_key(x_orchestrator_key)
    thread_id = f"results-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}-{uuid.uuid4().hex[:8]}"
    result = await run_result_tracking(thread_id)
    return {
        "status": "completed",
        "thread_id": thread_id,
        "picks_settled": result.get("picks_settled", 0),
        "retrained": result.get("retrained", False),
        "errors": result.get("errors", []),
    }
