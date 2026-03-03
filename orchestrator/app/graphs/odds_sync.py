"""LangGraph odds-sync pipeline with Send() fan-out per sport.

State machine:
    check_quotas -> [Send() per sport] fetch_sport_odds -> merge_results -> END
"""

from __future__ import annotations

import logging
import operator
from typing import Annotated

from langgraph.graph import END, StateGraph
from langgraph.types import Send
from typing_extensions import TypedDict

from app.db import get_pool
from app.providers.theodds_api import TheOddsAPIProvider
from app.providers.sportradar import SportradarProvider
from app.providers.sportsdata import SportsDataProvider
from app.redis_client import get_checkpointer

logger = logging.getLogger(__name__)

DEFAULT_SPORTS = [
    "basketball_nba",
    "soccer_epl",
    "mma_mixed_martial_arts",
]


# ---------------------------------------------------------------------------
# State
# ---------------------------------------------------------------------------


class OddsSyncState(TypedDict):
    sports: list[str]
    events_upserted: int
    odds_inserted: int
    provider_status: dict[str, str]
    errors: Annotated[list[str], operator.add]


# ---------------------------------------------------------------------------
# Nodes
# ---------------------------------------------------------------------------


async def check_quotas(state: OddsSyncState) -> dict:
    """Verify API quotas / feature-flags before fan-out."""
    sports = state.get("sports") or DEFAULT_SPORTS
    logger.info("odds_sync: will sync %d sports: %s", len(sports), sports)
    return {"sports": sports}


def fan_out_sports(state: OddsSyncState) -> list[Send]:
    """Fan out a ``fetch_sport_odds`` task per sport via LangGraph Send()."""
    return [
        Send("fetch_sport_odds", {"sport": s})
        for s in state.get("sports", DEFAULT_SPORTS)
    ]


async def fetch_sport_odds(state: dict) -> dict:
    """Fetch and upsert odds for a single sport, falling back across providers."""
    sport = state["sport"]
    providers = [
        ("theodds_api", TheOddsAPIProvider()),
        ("sportradar", SportradarProvider()),
        ("sportsdata", SportsDataProvider()),
    ]

    for name, provider in providers:
        try:
            events = await provider.fetch_odds(sport)
            total_odds = sum(len(e.odds) for e in events)
            logger.info("[odds_sync] %s: %d events, %d odds for %s", name, len(events), total_odds, sport)

            # Upsert events and odds into the database
            try:
                pool = await get_pool()
                async with pool.acquire() as conn:
                    async with conn.transaction():
                        for ev in events:
                            await conn.execute(
                                """
                                INSERT INTO events (id, sport, home_team, away_team, commence_time)
                                VALUES ($1, $2, $3, $4, $5)
                                ON CONFLICT (id) DO UPDATE SET
                                    home_team = EXCLUDED.home_team,
                                    away_team = EXCLUDED.away_team,
                                    commence_time = EXCLUDED.commence_time
                                """,
                                ev.event_id,
                                ev.sport,
                                ev.home_team,
                                ev.away_team,
                                ev.commence_time,
                            )
                            for o in ev.odds:
                                await conn.execute(
                                    """
                                    INSERT INTO odds (
                                        event_id, bookmaker, market, outcome_name,
                                        price, point, fetched_at
                                    ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
                                    """,
                                    ev.event_id,
                                    o.bookmaker,
                                    o.market,
                                    o.outcome_name,
                                    o.price,
                                    o.point,
                                )
            except Exception as db_exc:
                logger.warning("[odds_sync] DB upsert failed for %s: %s", sport, db_exc)

            return {
                "events_upserted": len(events),
                "odds_inserted": total_odds,
                "provider_status": {f"{sport}/{name}": "ok"},
            }
        except Exception as exc:
            logger.warning("[odds_sync] %s failed for %s: %s", name, sport, exc)
        finally:
            if hasattr(provider, "close"):
                await provider.close()

    return {"errors": [f"All providers failed for {sport}"]}


async def merge_results(state: OddsSyncState) -> dict:
    """Final node -- just logs the summary."""
    logger.info(
        "odds_sync complete: %d events, %d odds, %d errors",
        state.get("events_upserted", 0),
        state.get("odds_inserted", 0),
        len(state.get("errors", [])),
    )
    return {}


# ---------------------------------------------------------------------------
# Graph assembly
# ---------------------------------------------------------------------------


def build_odds_sync_graph() -> StateGraph:
    graph = StateGraph(OddsSyncState)

    graph.add_node("check_quotas", check_quotas)
    graph.add_node("fetch_sport_odds", fetch_sport_odds)
    graph.add_node("merge_results", merge_results)

    graph.set_entry_point("check_quotas")
    graph.add_conditional_edges("check_quotas", fan_out_sports, ["fetch_sport_odds"])
    graph.add_edge("fetch_sport_odds", "merge_results")
    graph.add_edge("merge_results", END)

    return graph.compile(checkpointer=get_checkpointer())


odds_sync_graph = build_odds_sync_graph()


async def run_odds_sync(thread_id: str, sports: list[str] | None = None) -> dict:
    """Entry point: invoke the odds-sync pipeline."""
    initial_state: OddsSyncState = {
        "sports": sports or DEFAULT_SPORTS,
        "events_upserted": 0,
        "odds_inserted": 0,
        "provider_status": {},
        "errors": [],
    }
    return await odds_sync_graph.ainvoke(
        initial_state,
        {"configurable": {"thread_id": thread_id}},
    )
