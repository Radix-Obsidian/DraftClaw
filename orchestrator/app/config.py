"""Centralised configuration via pydantic-settings.

All values come from environment variables (or a .env file when running
locally).  Import the singleton ``settings`` from anywhere in the app.
"""

from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Orchestrator environment configuration."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # -- Postgres ---------------------------------------------------------
    database_url: str = "postgresql://draftclaw:draftclaw@localhost:5432/draftclaw"

    # -- Redis ------------------------------------------------------------
    redis_url: str = "redis://localhost:6379/0"

    # -- Anthropic (Claude) -----------------------------------------------
    anthropic_api_key: str = ""

    # -- Internal orchestrator auth ---------------------------------------
    orchestrator_api_key: str = ""

    # -- The Odds API -----------------------------------------------------
    odds_api_key: str = ""

    # -- Sportradar -------------------------------------------------------
    sportradar_api_key: str = ""
    sportradar_nba_api_key: str = ""
    sportradar_soccer_api_key: str = ""
    sportradar_mma_api_key: str = ""

    # -- SportsData.io ----------------------------------------------------
    sportsdata_api_key: str = ""

    # -- Tuning -----------------------------------------------------------
    min_edge_percentage: float = 3.0
    pick_generation_concurrency: int = 4


# Module-level singleton – import this everywhere.
settings = Settings()
