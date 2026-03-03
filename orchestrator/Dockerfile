FROM python:3.12-slim AS base

WORKDIR /app

# System deps for asyncpg, hiredis, and scipy/sklearn
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install uv for fast dependency resolution
RUN pip install --no-cache-dir uv

# Copy project metadata first for layer caching
COPY pyproject.toml ./

# Install production dependencies via uv
RUN uv pip install --system --no-cache .

# Copy application source
COPY app/ ./app/

EXPOSE 8100

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8100", "--workers", "2"]
