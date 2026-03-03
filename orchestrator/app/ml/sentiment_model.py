"""FinBERT-based sentiment analysis for sports news.

Uses ``ProsusAI/finbert`` via HuggingFace ``transformers.pipeline``.
Financial-domain sentiment transfers well to "market-like" sports
narratives (injury impact, roster moves, line-movement analysis).

If the model fails to load (e.g. no GPU, download error), all calls
gracefully fall back to a neutral 0.0 score.
"""

from __future__ import annotations

import logging
from typing import Sequence

logger = logging.getLogger(__name__)

# Lazy-loaded pipeline singleton
_pipeline = None
_load_attempted = False


def _get_pipeline():
    """Lazily load the FinBERT pipeline (once)."""
    global _pipeline, _load_attempted
    if _load_attempted:
        return _pipeline
    _load_attempted = True
    try:
        from transformers import pipeline as hf_pipeline

        _pipeline = hf_pipeline(
            "text-classification",
            model="ProsusAI/finbert",
            top_k=None,
            truncation=True,
            max_length=512,
        )
        logger.info("FinBERT sentiment pipeline loaded successfully.")
    except Exception:
        logger.warning("Failed to load FinBERT pipeline; sentiment will default to 0.0.", exc_info=True)
        _pipeline = None
    return _pipeline


def _score_text(text: str) -> float:
    """Score a single text snippet on [-1.0, 1.0].

    Mapping: positive -> +score, negative -> -score, neutral -> 0.
    Falls back to 0.0 on any error.
    """
    pipe = _get_pipeline()
    if pipe is None:
        return 0.0
    try:
        results = pipe(text[:512])
        if not results:
            return 0.0
        # ``top_k=None`` returns a list of dicts per input.
        # Each dict has {"label": ..., "score": ...}.
        label_scores = results[0] if isinstance(results[0], list) else results
        score_map: dict[str, float] = {}
        for entry in label_scores:
            score_map[entry["label"].lower()] = entry["score"]

        pos = score_map.get("positive", 0.0)
        neg = score_map.get("negative", 0.0)
        # Net sentiment: positive weight minus negative weight
        return round(pos - neg, 4)
    except Exception:
        logger.warning("Sentiment scoring failed for text; returning 0.0.", exc_info=True)
        return 0.0


def team_sentiment(team_name: str, articles: Sequence[dict | str]) -> float:
    """Compute aggregate sentiment for *team_name* across *articles*.

    Parameters
    ----------
    team_name:
        Used for logging / traceability; the articles should already be
        filtered to this team.
    articles:
        List of raw text strings **or** dicts with ``title``, ``summary``,
        and/or ``content`` keys.

    Returns
    -------
    float
        Average sentiment in [-1.0, 1.0].  Returns 0.0 when no articles
        are provided or when the model is unavailable.
    """
    if not articles:
        return 0.0

    texts: list[str] = []
    for a in articles:
        if isinstance(a, str):
            texts.append(a)
        elif isinstance(a, dict):
            text = a.get("summary") or a.get("title") or a.get("content") or ""
            if text:
                texts.append(str(text))

    if not texts:
        return 0.0

    scores = [_score_text(t) for t in texts]
    avg = sum(scores) / len(scores) if scores else 0.0
    logger.debug("Sentiment for %s over %d articles: %.4f", team_name, len(texts), avg)
    return round(avg, 4)
