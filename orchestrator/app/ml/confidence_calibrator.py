"""ML confidence calibrator with cold-start heuristic.

Flow:
1. On cold start (< MIN_SAMPLES historical picks) use a simple heuristic
   that maps EV + sentiment into a 0-100 confidence score.
2. Once enough labelled samples exist, retrain a
   ``GradientBoostingClassifier`` wrapped in ``CalibratedClassifierCV``
   (isotonic) and persist via ``joblib``.

The calibrator converts raw model output into well-calibrated
probabilities (i.e. a 70% confidence means ~70% historical hit rate).
"""

from __future__ import annotations

import logging
import os
from pathlib import Path

import joblib
import numpy as np
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import GradientBoostingClassifier

logger = logging.getLogger(__name__)

MIN_SAMPLES: int = 50
MODEL_DIR = Path(os.getenv("CALIBRATOR_MODEL_DIR", "/tmp/draftclaw_models"))
MODEL_PATH = MODEL_DIR / "confidence_calibrator.joblib"

# Encode market types as numeric features for the model.
MARKET_ENCODE: dict[str, int] = {
    "h2h": 0,
    "spreads": 1,
    "totals": 2,
    "outrights": 3,
}


class ConfidenceCalibrator:
    """Isotonic-calibrated confidence scorer."""

    def __init__(self) -> None:
        self._model: CalibratedClassifierCV | None = None
        self._load()

    # -- Persistence ------------------------------------------------------

    def _load(self) -> None:
        """Attempt to load a previously trained model from disk."""
        if MODEL_PATH.exists():
            try:
                self._model = joblib.load(MODEL_PATH)
                logger.info("Loaded calibrator model from %s", MODEL_PATH)
            except Exception:
                logger.warning("Failed to load calibrator model; will use heuristic.", exc_info=True)
                self._model = None

    def _save(self) -> None:
        MODEL_DIR.mkdir(parents=True, exist_ok=True)
        joblib.dump(self._model, MODEL_PATH)
        logger.info("Saved calibrator model to %s", MODEL_PATH)

    # -- Cold-start heuristic ---------------------------------------------

    @staticmethod
    def heuristic(ev: float, sentiment: float = 0.0) -> float:
        """Simple cold-start confidence when we lack training data.

        Formula:
            base = min(ev * 5, 85)
            sentiment_adj = sentiment * 5   (clamped to [-10, 10])
            confidence = clamp(base + sentiment_adj, 0, 100)

        Parameters
        ----------
        ev:
            Expected value percentage (e.g. 5.0 means 5% edge).
        sentiment:
            Team sentiment score in [-1.0, 1.0].

        Returns
        -------
        float
            Confidence in [0, 100].
        """
        base = min(ev * 5, 85.0)
        sentiment_adj = max(-10.0, min(sentiment * 5, 10.0))
        return round(max(0.0, min(base + sentiment_adj, 100.0)), 2)

    # -- Calibrated prediction --------------------------------------------

    def predict(
        self,
        ev: float,
        sentiment: float = 0.0,
        hours_to_game: float = 24.0,
        sharp_book_count: int = 1,
        market_type: str = "h2h",
    ) -> float:
        """Return a calibrated confidence score (0-100).

        Falls back to the heuristic when no trained model is available.
        """
        if self._model is None:
            return self.heuristic(ev, sentiment)

        features = np.array([[ev, sentiment, hours_to_game, sharp_book_count, MARKET_ENCODE.get(market_type, 0)]])
        try:
            proba = self._model.predict_proba(features)[:, 1][0]
            return round(float(proba) * 100, 2)
        except Exception:
            logger.warning("Model prediction failed; falling back to heuristic.", exc_info=True)
            return self.heuristic(ev, sentiment)

    # -- Retraining -------------------------------------------------------

    def retrain(
        self,
        X: np.ndarray,
        y: np.ndarray,
    ) -> bool:
        """Retrain the calibrator from labelled historical picks.

        Parameters
        ----------
        X:
            Feature matrix of shape ``(n_samples, n_features)``.
            Expected columns: [ev, sentiment, ...optional extras].
        y:
            Binary labels: 1 = pick won, 0 = pick lost.

        Returns
        -------
        bool
            True if retraining succeeded, False otherwise.
        """
        if len(y) < MIN_SAMPLES:
            logger.info(
                "Only %d samples (need %d); skipping retrain.", len(y), MIN_SAMPLES
            )
            return False

        try:
            base = GradientBoostingClassifier(
                n_estimators=100,
                max_depth=3,
                learning_rate=0.1,
                random_state=42,
            )
            calibrated = CalibratedClassifierCV(
                estimator=base,
                method="isotonic",
                cv=5,
            )
            calibrated.fit(X, y)
            self._model = calibrated
            self._save()
            logger.info("Calibrator retrained on %d samples.", len(y))
            return True
        except Exception:
            logger.error("Calibrator retraining failed.", exc_info=True)
            return False


# Module-level singleton — import this from graph nodes.
calibrator = ConfidenceCalibrator()
