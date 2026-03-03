"""asyncpg connection-pool singleton.

Usage::

    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT 1")
"""

from __future__ import annotations

import asyncpg

from app.config import settings

_pool: asyncpg.Pool | None = None


async def get_pool() -> asyncpg.Pool:
    """Return (and lazily create) the global asyncpg connection pool."""
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            dsn=settings.database_url,
            min_size=2,
            max_size=10,
        )
    return _pool


async def close_pool() -> None:
    """Gracefully close the pool (call on shutdown)."""
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None
