"""Health and status endpoints.

Routes:
    GET /health             -- basic liveness probe
    GET /status/{thread_id} -- retrieve LangGraph thread state
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from app.db import get_pool
from app.redis_client import get_checkpointer, get_redis

router = APIRouter(tags=["health"])

logger = logging.getLogger(__name__)


@router.get("/health")
async def health():
    """Liveness check -- returns 200 if the service is running.

    Also performs lightweight connectivity probes to Postgres and Redis.
    """
    checks: dict[str, str] = {"service": "ok"}

    # Postgres probe
    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        checks["postgres"] = "ok"
    except Exception as exc:
        logger.warning("Health check: Postgres unreachable: %s", exc)
        checks["postgres"] = "error"

    # Redis probe
    try:
        redis = await get_redis()
        await redis.ping()
        checks["redis"] = "ok"
    except Exception as exc:
        logger.warning("Health check: Redis unreachable: %s", exc)
        checks["redis"] = "error"

    overall = "healthy" if all(v == "ok" for v in checks.values()) else "degraded"
    return {"status": overall, "checks": checks}


@router.get("/status/{thread_id}")
async def thread_status(thread_id: str):
    """Return the LangGraph checkpoint state for *thread_id*."""
    try:
        checkpointer = get_checkpointer()
        config = {"configurable": {"thread_id": thread_id}}
        state = checkpointer.get(config)
        if state is None:
            raise HTTPException(status_code=404, detail=f"Thread {thread_id} not found")
        return {
            "thread_id": thread_id,
            "checkpoint": state,
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Failed to retrieve thread %s: %s", thread_id, exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))
