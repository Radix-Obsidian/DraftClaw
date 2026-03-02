"""SportsData.io provider adapter.

Endpoint pattern:
    ``GET /v3/{sport}/odds/json/GameOddsLineMovement/{date}``

Supports NBA, NFL, MLB, NHL via sport key mapping.
"""

from __future__ import annotations

import logging
from datetime import date, datetime, timezone

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

BASE_URL = "https://api.sportsdata.io"

# Maps our canonical sport keys to SportsData.io path fragments.
SPORT_PATH_MAP: dict[str, str] = {
    "basketball_nba": "nba",
    "americanfootball_nfl": "nfl",
    "baseball_mlb": "mlb",
    "icehockey_nhl": "nhl",
}


class SportsDataProvider(OddsProvider):
    """Adapter for SportsData.io odds endpoints."""

    def __init__(self, api_key: str | None = None) -> None:
        self.api_key = api_key or settings.sportsdata_api_key
        self._client = httpx.AsyncClient(
            base_url=BASE_URL,
            timeout=httpx.Timeout(30.0),
        )

    def _sport_segment(self, sport: str) -> str:
        segment = SPORT_PATH_MAP.get(sport)
        if segment is None:
            raise ValueError(f"Unsupported sport for SportsData.io: {sport}")
        return segment

    async def _get_line_movement(self, sport: str, target_date: date) -> list[dict]:
        segment = self._sport_segment(sport)
        date_str = target_date.strftime("%Y-%m-%d")
        path = f"/v3/{segment}/odds/json/GameOddsLineMovement/{date_str}"
        resp = await _breaker.call_async(
            self._client.get,
            path,
            params={"key": self.api_key},
        )
        resp.raise_for_status()
        return resp.json()

    @staticmethod
    def _parse_events(raw: list[dict], sport: str) -> list[NormalizedEvent]:
        events: list[NormalizedEvent] = []
        for game in raw:
            game_id = str(game.get("GameId", game.get("GameID", "")))
            event = NormalizedEvent(
                event_id=game_id,
                sport=sport,
                home_team=game.get("HomeTeamName", ""),
                away_team=game.get("AwayTeamName", ""),
                commence_time=datetime.fromisoformat(
                    game.get("DateTime", "2000-01-01T00:00:00").replace("Z", "+00:00")
                ),
            )
            for movement in game.get("OddsLineMovement", []):
                bookmaker = movement.get("Sportsbook", {}).get("Name", "sportsdata").lower()
                for line in movement.get("Lines", []):
                    # Moneyline
                    home_ml = line.get("HomeMoneyLine")
                    away_ml = line.get("AwayMoneyLine")
                    if home_ml is not None:
                        event.odds.append(
                            NormalizedOdds(
                                bookmaker=bookmaker,
                                market="h2h",
                                outcome_name=game.get("HomeTeamName", "Home"),
                                price=american_to_decimal(int(home_ml)),
                            )
                        )
                    if away_ml is not None:
                        event.odds.append(
                            NormalizedOdds(
                                bookmaker=bookmaker,
                                market="h2h",
                                outcome_name=game.get("AwayTeamName", "Away"),
                                price=american_to_decimal(int(away_ml)),
                            )
                        )
                    # Totals
                    over_line = line.get("OverLine")
                    under_line = line.get("UnderLine")
                    total_number = line.get("TotalNumber")
                    if over_line is not None and total_number is not None:
                        event.odds.append(
                            NormalizedOdds(
                                bookmaker=bookmaker,
                                market="totals",
                                outcome_name="Over",
                                price=american_to_decimal(int(over_line)),
                                point=float(total_number),
                            )
                        )
                    if under_line is not None and total_number is not None:
                        event.odds.append(
                            NormalizedOdds(
                                bookmaker=bookmaker,
                                market="totals",
                                outcome_name="Under",
                                price=american_to_decimal(int(under_line)),
                                point=float(total_number),
                            )
                        )
            events.append(event)
        return events

    # -- Public API -------------------------------------------------------

    async def fetch_events(self, sport: str) -> list[NormalizedEvent]:
        today = date.today()
        raw = await self._get_line_movement(sport, today)
        return self._parse_events(raw, sport)

    async def fetch_odds(self, sport: str, event_ids: list[str] | None = None) -> list[NormalizedEvent]:
        events = await self.fetch_events(sport)
        if event_ids:
            target = set(event_ids)
            events = [e for e in events if e.event_id in target]
        return events

    async def fetch_results(self, sport: str, event_ids: list[str]) -> list[dict]:
        # SportsData.io results come from a different endpoint (scores).
        logger.warning("SportsData fetch_results not fully implemented; returning empty.")
        return []

    async def close(self) -> None:
        await self._client.aclose()
