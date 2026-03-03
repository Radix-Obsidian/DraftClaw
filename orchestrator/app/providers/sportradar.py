"""Sportradar provider adapter.

Sport-specific endpoints:
- NBA:    ``/basketball/trial/v8/en/odds/pre-match/events.json``
- Soccer: ``/soccer/trial/v4/en/odds/pre-match/events.json``
- MMA:    ``/mma/trial/v2/en/odds/pre-match/events.json``
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
    american_to_decimal,
)

logger = logging.getLogger(__name__)

_breaker = CircuitBreaker(fail_max=5, reset_timeout=60)

BASE_URL = "https://api.sportradar.com"

# Maps our canonical sport keys to Sportradar path fragments.
SPORT_ENDPOINTS: dict[str, str] = {
    "basketball_nba": "/basketball/trial/v8/en/odds/pre-match/events.json",
    "soccer_epl": "/soccer/trial/v4/en/odds/pre-match/events.json",
    "mma_mixed_martial_arts": "/mma/trial/v2/en/odds/pre-match/events.json",
}

# Per-sport API key override support.
_SPORT_KEY_MAP: dict[str, str] = {
    "basketball_nba": "sportradar_nba_api_key",
    "soccer_epl": "sportradar_soccer_api_key",
    "mma_mixed_martial_arts": "sportradar_mma_api_key",
}


class SportradarProvider(OddsProvider):
    """Adapter for Sportradar odds endpoints."""

    def __init__(self) -> None:
        self._client = httpx.AsyncClient(
            base_url=BASE_URL,
            timeout=httpx.Timeout(30.0),
        )

    def _api_key_for(self, sport: str) -> str:
        attr = _SPORT_KEY_MAP.get(sport, "sportradar_api_key")
        return getattr(settings, attr, "") or settings.sportradar_api_key

    async def _get(self, sport: str) -> dict:
        endpoint = SPORT_ENDPOINTS.get(sport)
        if endpoint is None:
            raise ValueError(f"Unsupported sport for Sportradar: {sport}")
        api_key = self._api_key_for(sport)
        resp = await _breaker.call_async(
            self._client.get,
            endpoint,
            params={"api_key": api_key},
        )
        resp.raise_for_status()
        return resp.json()

    @staticmethod
    def _parse_events(raw: dict, sport: str) -> list[NormalizedEvent]:
        events: list[NormalizedEvent] = []
        for item in raw.get("sport_events", []):
            competitors = item.get("competitors", [])
            home = next((c for c in competitors if c.get("qualifier") == "home"), None)
            away = next((c for c in competitors if c.get("qualifier") == "away"), None)

            event = NormalizedEvent(
                event_id=item.get("id", ""),
                sport=sport,
                home_team=home["name"] if home else "",
                away_team=away["name"] if away else "",
                commence_time=datetime.fromisoformat(
                    item.get("scheduled", "").replace("Z", "+00:00")
                ),
            )

            for consensus in item.get("consensus", []):
                market = consensus.get("market_type", "h2h")
                for line in consensus.get("lines", []):
                    bookmaker = line.get("bookmaker", {}).get("key", "sportradar")
                    for outcome in line.get("outcomes", []):
                        raw_odds = outcome.get("odds")
                        if raw_odds is None:
                            continue
                        # Sportradar may return American – normalise to decimal.
                        decimal_odds = (
                            american_to_decimal(int(raw_odds))
                            if isinstance(raw_odds, int) or (isinstance(raw_odds, str) and raw_odds.lstrip("-").isdigit())
                            else float(raw_odds)
                        )
                        event.odds.append(
                            NormalizedOdds(
                                bookmaker=bookmaker,
                                market=market,
                                outcome_name=outcome.get("name", ""),
                                price=decimal_odds,
                                point=outcome.get("spread") or outcome.get("total"),
                            )
                        )
            events.append(event)
        return events

    # -- Public API -------------------------------------------------------

    async def fetch_events(self, sport: str) -> list[NormalizedEvent]:
        raw = await self._get(sport)
        return self._parse_events(raw, sport)

    async def fetch_odds(self, sport: str, event_ids: list[str] | None = None) -> list[NormalizedEvent]:
        events = await self.fetch_events(sport)
        if event_ids:
            target = set(event_ids)
            events = [e for e in events if e.event_id in target]
        return events

    async def fetch_results(self, sport: str, event_ids: list[str]) -> list[dict]:
        # Sportradar results come from a separate schedule/results endpoint.
        # Placeholder: the orchestrator currently uses The Odds API for results.
        logger.warning("Sportradar fetch_results not fully implemented; returning empty.")
        return []

    async def close(self) -> None:
        await self._client.aclose()
