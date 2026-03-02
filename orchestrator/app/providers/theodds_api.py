"""The Odds API provider adapter.

Docs: https://the-odds-api.com/liveapi/guides/v4/
Endpoint pattern: ``GET /v4/sports/{sport}/odds``
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

import httpx
from pybreaker import CircuitBreaker

from app.config import settings
from app.providers.base import (
    NormalizedEvent,
    NormalizedOdds,
    OddsProvider,
)

logger = logging.getLogger(__name__)

_breaker = CircuitBreaker(fail_max=5, reset_timeout=60)

BASE_URL = "https://api.the-odds-api.com"


class TheOddsAPIProvider(OddsProvider):
    """Adapter for The Odds API v4."""

    def __init__(self, api_key: str | None = None) -> None:
        self.api_key = api_key or settings.odds_api_key
        self._client = httpx.AsyncClient(
            base_url=BASE_URL,
            timeout=httpx.Timeout(30.0),
        )

    # -- helpers ----------------------------------------------------------

    async def _get(self, path: str, params: dict | None = None) -> list[dict]:
        params = params or {}
        params["apiKey"] = self.api_key
        resp = await _breaker.call_async(self._client.get, path, params=params)
        resp.raise_for_status()
        return resp.json()

    @staticmethod
    def _parse_events(raw: list[dict], include_odds: bool = True) -> list[NormalizedEvent]:
        events: list[NormalizedEvent] = []
        for item in raw:
            event = NormalizedEvent(
                event_id=item["id"],
                sport=item.get("sport_key", ""),
                home_team=item.get("home_team", ""),
                away_team=item.get("away_team", ""),
                commence_time=datetime.fromisoformat(
                    item["commence_time"].replace("Z", "+00:00")
                ),
            )
            if include_odds:
                for bm in item.get("bookmakers", []):
                    bm_key = bm["key"]
                    bm_update = bm.get("last_update")
                    for market in bm.get("markets", []):
                        mkt_key = market["key"]
                        for outcome in market.get("outcomes", []):
                            event.odds.append(
                                NormalizedOdds(
                                    bookmaker=bm_key,
                                    market=mkt_key,
                                    outcome_name=outcome["name"],
                                    price=float(outcome["price"]),
                                    point=outcome.get("point"),
                                    last_update=(
                                        datetime.fromisoformat(bm_update.replace("Z", "+00:00"))
                                        if bm_update
                                        else None
                                    ),
                                )
                            )
            events.append(event)
        return events

    # -- public API -------------------------------------------------------

    async def fetch_events(self, sport: str) -> list[NormalizedEvent]:
        """Fetch upcoming events (no odds) for *sport*."""
        raw = await self._get(f"/v4/sports/{sport}/events")
        return self._parse_events(raw, include_odds=False)

    async def fetch_odds(
        self,
        sport: str,
        event_ids: list[str] | None = None,
        markets: str = "h2h,totals",
        regions: str = "us",
    ) -> list[NormalizedEvent]:
        """Fetch events with odds from ``/v4/sports/{sport}/odds``.

        Parameters
        ----------
        sport:
            The Odds API sport key, e.g. ``basketball_nba``.
        event_ids:
            Optional list to filter specific events.
        markets:
            Comma-separated market keys.
        regions:
            Comma-separated region keys.
        """
        params: dict[str, str] = {
            "regions": regions,
            "markets": markets,
            "oddsFormat": "decimal",
        }
        if event_ids:
            params["eventIds"] = ",".join(event_ids)

        raw = await self._get(f"/v4/sports/{sport}/odds", params=params)
        return self._parse_events(raw, include_odds=True)

    async def fetch_results(self, sport: str, event_ids: list[str]) -> list[dict]:
        """Fetch completed-event scores from ``/v4/sports/{sport}/scores``."""
        params: dict[str, str] = {"daysFrom": "3"}
        raw = await self._get(f"/v4/sports/{sport}/scores", params=params)
        results = []
        target_ids = set(event_ids)
        for item in raw:
            if item["id"] in target_ids and item.get("completed"):
                results.append(
                    {
                        "event_id": item["id"],
                        "home_team": item.get("home_team"),
                        "away_team": item.get("away_team"),
                        "scores": item.get("scores"),
                        "completed": True,
                    }
                )
        return results

    async def close(self) -> None:
        await self._client.aclose()
