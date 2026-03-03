"""DraftClaw LangGraph Orchestrator — FastAPI entry point."""
from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI

from .db import get_pool, close_pool
from .redis_client import close_redis
from .routes.health import router as health_router
from .routes.triggers import router as triggers_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Orchestrator starting up...")
    await get_pool()
    logger.info("Database pool connected.")
    yield
    logger.info("Orchestrator shutting down...")
    await close_pool()
    await close_redis()


app = FastAPI(
    title="DraftClaw Orchestrator",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(health_router)
app.include_router(triggers_router)
