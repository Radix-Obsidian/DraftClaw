"""Redis async client and LangGraph checkpointer.

Provides:
- ``get_redis()``  -- shared ``redis.asyncio`` client
- ``get_checkpointer()`` -- ``RedisSaver`` for LangGraph state persistence
"""

from __future__ import annotations

import redis.asyncio as aioredis
from langgraph.checkpoint.redis import RedisSaver

from app.config import settings

_redis: aioredis.Redis | None = None
_checkpointer: RedisSaver | None = None


async def get_redis() -> aioredis.Redis:
    """Return (and lazily create) the shared async Redis client."""
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(
            settings.redis_url,
            decode_responses=True,
        )
    return _redis


async def close_redis() -> None:
    """Close the Redis connection (call on shutdown)."""
    global _redis
    if _redis is not None:
        await _redis.aclose()
        _redis = None


def get_checkpointer() -> RedisSaver:
    """Return a LangGraph RedisSaver backed by the configured Redis URL."""
    global _checkpointer
    if _checkpointer is None:
        _checkpointer = RedisSaver(settings.redis_url)
    return _checkpointer
