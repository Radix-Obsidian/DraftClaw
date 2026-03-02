"""Abstract base for odds providers and shared helpers.

Every concrete provider normalises its upstream response into
``NormalizedEvent`` / ``NormalizedOdds`` so the rest of the pipeline is
source-agnostic.
"""

from __future__ import annotations

import abc
from dataclasses import dataclass, field
from datetime import datetime


# -- Sharp books used for true-probability estimation ---------------------
SHARP_BOOKS: set[str] = {"pinnacle", "lowvig", "betcris", "circa"}

SOFT_BOOKS: set[str] = {"fanduel", "draftkings", "betmgm", "pointsbet", "caesars"}


# -- Dataclasses ----------------------------------------------------------

@dataclass
class NormalizedOdds:
    """A single outcome line from a bookmaker."""

    bookmaker: str
    market: str          # "h2h", "totals", "spreads"
    outcome_name: str    # team name or "Over"/"Under"
    price: float         # decimal odds (e.g. 1.91)
    point: float | None = None  # spread / total line
    last_update: datetime | None = None


@dataclass
class NormalizedEvent:
    """An upcoming (or live) sporting event with all collected odds."""

    event_id: str
    sport: str
    home_team: str
    away_team: str
    commence_time: datetime
    odds: list[NormalizedOdds] = field(default_factory=list)


# -- Odds conversion helpers ----------------------------------------------

def american_to_decimal(american: int) -> float:
    """Convert American odds to decimal odds.

    +150 -> 2.50
    -200 -> 1.50
    """
    if american > 0:
        return round(american / 100 + 1, 4)
    else:
        return round(100 / abs(american) + 1, 4)


def decimal_to_american(decimal_odds: float) -> int:
    """Convert decimal odds to American odds.

    2.50 -> +150
    1.50 -> -200
    """
    if decimal_odds >= 2.0:
        return round((decimal_odds - 1) * 100)
    else:
        return round(-100 / (decimal_odds - 1))


# -- Abstract provider ----------------------------------------------------

class OddsProvider(abc.ABC):
    """Interface every odds/results provider must implement."""

    @abc.abstractmethod
    async def fetch_events(self, sport: str) -> list[NormalizedEvent]:
        """Return upcoming events for *sport* (e.g. ``basketball_nba``)."""
        ...

    @abc.abstractmethod
    async def fetch_odds(self, sport: str, event_ids: list[str] | None = None) -> list[NormalizedEvent]:
        """Return events with odds populated."""
        ...

    @abc.abstractmethod
    async def fetch_results(self, sport: str, event_ids: list[str]) -> list[dict]:
        """Return settled results for the given event IDs."""
        ...
