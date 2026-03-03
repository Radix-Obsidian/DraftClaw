"""LangGraph pick-generation pipeline.

State machine:
    load_events -> fetch_odds -> fetch_news -> ev_analysis
    -> sentiment_analysis -> confidence_ml -> classify_picks
    -> persist_picks -> [conditional] anchor_broadcast -> END

The EV math (remove_vig, calculate_ev) is a direct port of the
TypeScript implementation in ``extensions/draft-claw/src/analysis.ts``.
"""

from __future__ import annotations

import logging
import operator
from datetime import date, datetime, timezone
from typing import Annotated, Optional

from langgraph.graph import END, StateGraph
from typing_extensions import TypedDict

from app.config import settings
from app.db import get_pool
from app.ml.confidence_calibrator import ConfidenceCalibrator
from app.ml.sentiment_model import team_sentiment
from app.providers.base import SHARP_BOOKS, SOFT_BOOKS, NormalizedOdds
from app.providers.theodds_api import TheOddsAPIProvider
from app.redis_client import get_checkpointer

logger = logging.getLogger(__name__)

EV_THRESHOLD: float = 3.0
HIGH_CONFIDENCE_THRESHOLD: float = 65.0

_calibrator = ConfidenceCalibrator()

# ---------------------------------------------------------------------------
# Odds conversion helpers (ported from analysis.ts)
# ---------------------------------------------------------------------------


def american_to_decimal(american: int) -> float:
    """Convert American odds to decimal.  +150 -> 2.50, -200 -> 1.50."""
    if american > 0:
        return round(american / 100 + 1, 4)
    return round(100 / abs(american) + 1, 4)


def decimal_to_implied(decimal_odds: float) -> float:
    """Decimal odds -> implied probability."""
    return 1.0 / decimal_odds


def _outcome_decimal(o: dict) -> float:
    """Extract decimal odds from an outcome dict.

    Supports both ``price`` (decimal) and ``american_odds`` (American) keys.
    """
    if "price" in o:
        return float(o["price"])
    if "american_odds" in o:
        return american_to_decimal(int(o["american_odds"]))
    raise KeyError("Outcome dict must have 'price' or 'american_odds'")


def remove_vig(outcomes: list[dict]) -> dict[str, float]:
    """Strip the vig from a set of outcomes and return true probabilities.

    Each outcome dict must have ``outcome_name`` (str) and either ``price``
    (decimal odds float) or ``american_odds`` (int).

    Ported from the TypeScript ``removeVig`` in analysis.ts.
    """
    if not outcomes:
        return {}
    total_implied = sum(decimal_to_implied(_outcome_decimal(o)) for o in outcomes)
    if total_implied == 0:
        return {}
    vig_multiplier = 1.0 / total_implied
    return {
        o["outcome_name"]: decimal_to_implied(_outcome_decimal(o)) * vig_multiplier
        for o in outcomes
    }


def calculate_ev(soft_decimal_odds: float, true_prob: float) -> float:
    """Expected value as a percentage.

    EV% = (decimal_odds * true_probability - 1) * 100
    Ported from the TypeScript ``calculateEV`` in analysis.ts.
    """
    return (soft_decimal_odds * true_prob - 1.0) * 100.0


# ---------------------------------------------------------------------------
# State definition
# ---------------------------------------------------------------------------


class PickGenerationState(TypedDict):
    sport: str
    run_date: str
    events: list[dict]
    odds_data: Annotated[list[dict], operator.add]
    news_articles: list[dict]
    ev_analyses: list[dict]
    sentiment_scores: dict[str, float]
    calibrated_picks: list[dict]
    anchor_content: Optional[str]
    errors: Annotated[list[str], operator.add]


# ---------------------------------------------------------------------------
# Nodes
# ---------------------------------------------------------------------------


async def load_events(state: PickGenerationState) -> dict:
    """Load upcoming events from the database for the requested sport."""
    try:
        pool = await get_pool()
        rows = await pool.fetch(
            """
            SELECT id, sport, home_team, away_team, commence_time
            FROM events
            WHERE sport = $1
              AND commence_time > NOW()
              AND commence_time < NOW() + INTERVAL '48 hours'
            ORDER BY commence_time
            LIMIT 20
            """,
            state["sport"],
        )
        return {"events": [dict(r) for r in rows]}
    except Exception as exc:
        logger.error("load_events failed: %s", exc, exc_info=True)
        return {"events": [], "errors": [f"load_events: {exc}"]}


async def fetch_odds(state: PickGenerationState) -> dict:
    """Fetch odds from The Odds API (primary provider)."""
    sport = state["sport"]
    provider = TheOddsAPIProvider()
    try:
        normalized_events = await provider.fetch_odds(sport)
        odds_rows: list[dict] = []
        for ne in normalized_events:
            for o in ne.odds:
                odds_rows.append(
                    {
                        "event_id": ne.event_id,
                        "home_team": ne.home_team,
                        "away_team": ne.away_team,
                        "commence_time": ne.commence_time.isoformat(),
                        "bookmaker": o.bookmaker,
                        "market": o.market,
                        "outcome_name": o.outcome_name,
                        "price": o.price,
                        "point": o.point,
                        "is_sharp": o.bookmaker.lower() in SHARP_BOOKS,
                    }
                )
        return {"odds_data": odds_rows}
    except Exception as exc:
        logger.error("fetch_odds failed: %s", exc, exc_info=True)
        return {"odds_data": [], "errors": [f"fetch_odds: {exc}"]}
    finally:
        await provider.close()


async def fetch_news(state: PickGenerationState) -> dict:
    """Load recent news articles from the database."""
    try:
        pool = await get_pool()
        rows = await pool.fetch(
            """
            SELECT title, summary, content, published_at, team_name
            FROM news_articles
            WHERE sport = $1
              AND published_at > NOW() - INTERVAL '7 days'
            ORDER BY published_at DESC
            LIMIT 50
            """,
            state["sport"],
        )
        return {"news_articles": [dict(r) for r in rows]}
    except Exception as exc:
        logger.error("fetch_news failed: %s", exc, exc_info=True)
        return {"news_articles": [], "errors": [f"fetch_news: {exc}"]}


async def ev_analysis(state: PickGenerationState) -> dict:
    """Run EV analysis: remove vig from sharp lines, compare to soft book prices."""
    analyses: list[dict] = []
    events = state["events"]
    all_odds = state["odds_data"]

    for event in events:
        eid = str(event["id"])
        event_odds = [o for o in all_odds if o["event_id"] == eid]

        for market_key in ("h2h", "totals"):
            # Collect sharp-book outcomes for this market
            sharp_outcomes: list[dict] = [
                o for o in event_odds if o["is_sharp"] and o["market"] == market_key
            ]
            soft_outcomes: list[dict] = [
                o for o in event_odds if not o["is_sharp"] and o["market"] == market_key
            ]
            if not sharp_outcomes or not soft_outcomes:
                continue

            # Group sharp outcomes by bookmaker, remove vig, then average
            books: dict[str, list[dict]] = {}
            for o in sharp_outcomes:
                books.setdefault(o["bookmaker"], []).append(o)

            all_probs: dict[str, list[float]] = {}
            for _bk, outcomes in books.items():
                true_probs = remove_vig(outcomes)
                for name, prob in true_probs.items():
                    all_probs.setdefault(name, []).append(prob)

            avg_probs = {
                name: sum(ps) / len(ps) for name, ps in all_probs.items()
            }

            # Compare each soft-book outcome against sharp consensus
            for o in soft_outcomes:
                true_prob = avg_probs.get(o["outcome_name"])
                if true_prob is None:
                    continue
                ev = calculate_ev(o["price"], true_prob)
                if ev < EV_THRESHOLD:
                    continue

                sharp_count = len(books)
                analyses.append(
                    {
                        "event_id": eid,
                        "sport": event.get("sport", state["sport"]),
                        "home_team": event["home_team"],
                        "away_team": event["away_team"],
                        "commence_time": str(event.get("commence_time", "")),
                        "market": market_key,
                        "outcome_name": o["outcome_name"],
                        "bookmaker": o["bookmaker"],
                        "price": o["price"],
                        "point": o.get("point"),
                        "ev_percentage": round(ev, 2),
                        "true_prob": round(true_prob, 4),
                        "implied_prob": round(decimal_to_implied(o["price"]), 4),
                        "sharp_book_count": sharp_count,
                    }
                )

    # Sort by EV descending (mirror TS: analyses.sort((a, b) => b.edge - a.edge))
    analyses.sort(key=lambda a: a["ev_percentage"], reverse=True)
    return {"ev_analyses": analyses}


async def sentiment_analysis(state: PickGenerationState) -> dict:
    """Score team sentiment from recent news articles."""
    teams: set[str] = set()
    for a in state["ev_analyses"]:
        teams.add(a["home_team"])
        teams.add(a["away_team"])

    articles = state.get("news_articles", [])
    scores: dict[str, float] = {}
    for team in teams:
        team_articles = [
            a.get("summary") or a.get("content") or a.get("title", "")
            for a in articles
            if a.get("team_name", "").lower() == team.lower()
            or team.lower() in (a.get("title", "") + " " + a.get("summary", "")).lower()
        ]
        scores[team] = team_sentiment(team, team_articles)

    return {"sentiment_scores": scores}


async def confidence_ml(state: PickGenerationState) -> dict:
    """Apply the ML calibrator (or cold-start heuristic) to each EV analysis."""
    calibrated: list[dict] = []
    for a in state["ev_analyses"]:
        pick_team = a["outcome_name"]
        sentiment = state.get("sentiment_scores", {}).get(pick_team, 0.0)

        # Calculate hours to game for feature input
        try:
            gt = datetime.fromisoformat(str(a.get("commence_time", "")).replace("Z", "+00:00"))
            hours_to_game = max(0.0, (gt - datetime.now(timezone.utc)).total_seconds() / 3600)
        except Exception:
            hours_to_game = 24.0

        confidence = _calibrator.predict(
            ev=a["ev_percentage"],
            sentiment=sentiment,
            hours_to_game=hours_to_game,
            sharp_book_count=a.get("sharp_book_count", 1),
            market_type=a.get("market", "h2h"),
        )
        calibrated.append(
            {**a, "confidence": confidence, "sentiment_score": sentiment}
        )
    return {"ev_analyses": calibrated}


async def classify_picks(state: PickGenerationState) -> dict:
    """Classify each analysis into pick types: lock, value, or longshot."""
    picks: list[dict] = []
    for a in state["ev_analyses"]:
        conf = a.get("confidence", 50.0)
        ev = a["ev_percentage"]

        if conf >= 75 or ev >= 8:
            pick_type = "lock"
            units = 3
        elif ev >= 12 and conf < 55:
            pick_type = "longshot"
            units = 1
        else:
            pick_type = "value"
            units = 2

        picks.append({**a, "pick_type": pick_type, "units": units})
    return {"calibrated_picks": picks}


async def persist_picks(state: PickGenerationState) -> dict:
    """Write classified picks to the database."""
    picks = state.get("calibrated_picks", [])
    if not picks:
        return {}

    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            async with conn.transaction():
                for p in picks:
                    await conn.execute(
                        """
                        INSERT INTO picks (
                            sport, type, matchup, selection, odds,
                            claw_edge, anchor_take, confidence,
                            game_time, event_id, affiliate_links,
                            is_active, generated_at, expires_at
                        ) VALUES (
                            $1, $2, $3, $4, $5,
                            $6, $7, $8,
                            $9, $10, $11,
                            $12, $13, $14
                        ) ON CONFLICT DO NOTHING
                        """,
                        state["sport"],
                        p["pick_type"],
                        f"{p['home_team']} vs {p['away_team']}",
                        p["outcome_name"],
                        str(p["price"]),
                        p["ev_percentage"],
                        f"EV:{p['ev_percentage']:.1f}%|Conf:{p['confidence']:.0f}%",
                        p["confidence"],
                        p.get("commence_time", ""),
                        p["event_id"],
                        "{}",
                        True,
                        datetime.now(timezone.utc).isoformat(),
                        p.get("commence_time", ""),
                    )
        return {}
    except Exception as exc:
        logger.error("persist_picks failed: %s", exc, exc_info=True)
        return {"errors": [f"persist_picks: {exc}"]}


async def anchor_broadcast(state: PickGenerationState) -> dict:
    """Use Claude to generate an anchor-style broadcast for high-confidence picks."""
    high_conf = [
        p for p in state.get("calibrated_picks", [])
        if p.get("confidence", 0) >= HIGH_CONFIDENCE_THRESHOLD
    ]
    if not high_conf:
        return {"anchor_content": None}

    try:
        import anthropic

        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        summary_lines = []
        for p in high_conf[:5]:
            american = (
                f"+{round((p['price'] - 1) * 100)}"
                if p["price"] >= 2.0
                else f"{round(-100 / (p['price'] - 1))}"
            )
            summary_lines.append(
                f"- {p['outcome_name']} ({american}) | EV {p['ev_percentage']:.1f}% | "
                f"Conf {p['confidence']:.0f}%"
            )
        summary = "\n".join(summary_lines)

        msg = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=512,
            messages=[
                {
                    "role": "user",
                    "content": (
                        "You are The Anchor, DraftClaw's sharp sports analyst persona. "
                        f"Write a brief, punchy broadcast about today's top {state['sport']} picks. "
                        "Be confident but not reckless. Reference the edge and confidence.\n\n"
                        f"{summary}"
                    ),
                }
            ],
        )
        return {"anchor_content": msg.content[0].text}
    except Exception as exc:
        logger.error("anchor_broadcast failed: %s", exc, exc_info=True)
        return {"anchor_content": None, "errors": [f"anchor_broadcast: {exc}"]}


# ---------------------------------------------------------------------------
# Conditional routing
# ---------------------------------------------------------------------------


def should_broadcast(state: PickGenerationState) -> str:
    """Route to anchor_broadcast if any pick exceeds the confidence threshold."""
    picks = state.get("calibrated_picks", [])
    if any(p.get("confidence", 0) >= HIGH_CONFIDENCE_THRESHOLD for p in picks):
        return "anchor_broadcast"
    return END


# ---------------------------------------------------------------------------
# Graph assembly
# ---------------------------------------------------------------------------


def build_pick_generation_graph() -> StateGraph:
    """Construct and compile the pick-generation LangGraph."""
    graph = StateGraph(PickGenerationState)

    # Add nodes
    graph.add_node("load_events", load_events)
    graph.add_node("fetch_odds", fetch_odds)
    graph.add_node("fetch_news", fetch_news)
    graph.add_node("ev_analysis", ev_analysis)
    graph.add_node("sentiment_analysis", sentiment_analysis)
    graph.add_node("confidence_ml", confidence_ml)
    graph.add_node("classify_picks", classify_picks)
    graph.add_node("persist_picks", persist_picks)
    graph.add_node("anchor_broadcast", anchor_broadcast)

    # Linear edges
    graph.set_entry_point("load_events")
    graph.add_edge("load_events", "fetch_odds")
    graph.add_edge("fetch_odds", "fetch_news")
    graph.add_edge("fetch_news", "ev_analysis")
    graph.add_edge("ev_analysis", "sentiment_analysis")
    graph.add_edge("sentiment_analysis", "confidence_ml")
    graph.add_edge("confidence_ml", "classify_picks")
    graph.add_edge("classify_picks", "persist_picks")

    # Conditional: persist_picks -> anchor_broadcast OR END
    graph.add_conditional_edges(
        "persist_picks",
        should_broadcast,
        {"anchor_broadcast": "anchor_broadcast", END: END},
    )
    graph.add_edge("anchor_broadcast", END)

    return graph.compile(checkpointer=get_checkpointer())


pick_generation_graph = build_pick_generation_graph()


async def run_pick_generation(sport: str, thread_id: str) -> dict:
    """Entry point: invoke the full pick-generation pipeline."""
    initial_state: PickGenerationState = {
        "sport": sport,
        "run_date": date.today().isoformat(),
        "events": [],
        "odds_data": [],
        "news_articles": [],
        "ev_analyses": [],
        "sentiment_scores": {},
        "calibrated_picks": [],
        "anchor_content": None,
        "errors": [],
    }
    return await pick_generation_graph.ainvoke(
        initial_state,
        {"configurable": {"thread_id": thread_id}},
    )
