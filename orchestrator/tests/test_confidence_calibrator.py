"""Tests for the confidence calibrator: heuristic, predict, retrain, and singleton."""

from __future__ import annotations

import numpy as np
import pytest

from app.ml.confidence_calibrator import (
    ConfidenceCalibrator,
    MARKET_ENCODE,
    MIN_SAMPLES,
    calibrator,
)


# ---------------------------------------------------------------------------
# Cold-start heuristic
# ---------------------------------------------------------------------------


class TestHeuristic:
    """Verify the cold-start heuristic: min(ev*5, 85) + sentiment_adj."""

    def test_basic_ev(self):
        # ev=5 -> base=25, sentiment=0 -> 25.0
        assert ConfidenceCalibrator.heuristic(5.0) == pytest.approx(25.0)

    def test_high_ev_cap(self):
        # ev=20 -> base=min(100, 85)=85
        assert ConfidenceCalibrator.heuristic(20.0) == pytest.approx(85.0)

    def test_positive_sentiment_boost(self):
        base = ConfidenceCalibrator.heuristic(5.0, 0.0)
        boosted = ConfidenceCalibrator.heuristic(5.0, 0.5)
        assert boosted > base

    def test_negative_sentiment_penalty(self):
        base = ConfidenceCalibrator.heuristic(5.0, 0.0)
        penalised = ConfidenceCalibrator.heuristic(5.0, -0.5)
        assert penalised < base

    def test_positive_sentiment_exact(self):
        # ev=10 -> base=50, sentiment=0.5 -> adj=2.5 -> 52.5
        assert ConfidenceCalibrator.heuristic(10.0, 0.5) == pytest.approx(52.5)

    def test_negative_sentiment_exact(self):
        # ev=10 -> base=50, sentiment=-0.8 -> adj=-4.0 -> 46.0
        assert ConfidenceCalibrator.heuristic(10.0, -0.8) == pytest.approx(46.0)

    def test_zero_ev(self):
        assert ConfidenceCalibrator.heuristic(0.0) == pytest.approx(0.0)

    def test_very_low_ev(self):
        # ev=1 -> base=5, sentiment=0 -> 5.0
        assert ConfidenceCalibrator.heuristic(1.0) == pytest.approx(5.0)

    def test_clamp_floor(self):
        # ev=0, sentiment=-1.0 -> base=0 + adj=-5 -> clamped to 0.0
        score = ConfidenceCalibrator.heuristic(0.0, -1.0)
        assert score >= 0.0

    def test_clamp_ceiling(self):
        score = ConfidenceCalibrator.heuristic(100.0, 1.0)
        assert score <= 100.0

    def test_sentiment_clamped_positive(self):
        # sentiment_adj capped at +10: sentiment=5.0 -> adj=min(25,10)=10
        # ev=10 -> base=50 -> 60.0
        assert ConfidenceCalibrator.heuristic(10.0, 5.0) == pytest.approx(60.0)

    def test_sentiment_clamped_negative(self):
        # sentiment_adj capped at -10: sentiment=-5.0 -> adj=max(-25,-10)=-10
        # ev=10 -> base=50 -> 40.0
        assert ConfidenceCalibrator.heuristic(10.0, -5.0) == pytest.approx(40.0)


# ---------------------------------------------------------------------------
# MARKET_ENCODE
# ---------------------------------------------------------------------------


class TestMarketEncode:
    def test_h2h(self):
        assert MARKET_ENCODE["h2h"] == 0

    def test_spreads(self):
        assert MARKET_ENCODE["spreads"] == 1

    def test_totals(self):
        assert MARKET_ENCODE["totals"] == 2

    def test_outrights(self):
        assert MARKET_ENCODE["outrights"] == 3


# ---------------------------------------------------------------------------
# Predict (cold start = heuristic)
# ---------------------------------------------------------------------------


class TestPredict:
    def test_cold_start_uses_heuristic(self):
        cal = ConfidenceCalibrator()
        cal._model = None
        result = cal.predict(5.0, 0.2, 12.0, 3, "h2h")
        expected = cal.heuristic(5.0, 0.2)
        assert result == pytest.approx(expected)

    def test_predict_with_different_market(self):
        cal = ConfidenceCalibrator()
        cal._model = None
        result = cal.predict(8.0, 0.0, 24.0, 1, "totals")
        expected = cal.heuristic(8.0, 0.0)
        assert result == pytest.approx(expected)


# ---------------------------------------------------------------------------
# Retrain
# ---------------------------------------------------------------------------


class TestRetrain:
    def test_too_few_samples(self):
        cal = ConfidenceCalibrator()
        cal._model = None
        X = np.random.rand(10, 5)
        y = np.random.randint(0, 2, 10)
        assert cal.retrain(X, y) is False
        assert cal._model is None

    def test_retrain_succeeds_with_enough_samples(self):
        rng = np.random.RandomState(42)
        n = 100
        X = rng.rand(n, 5)
        y = rng.randint(0, 2, n)

        cal = ConfidenceCalibrator()
        cal._model = None
        success = cal.retrain(X, y)
        assert success is True
        assert cal._model is not None

    def test_predict_after_retrain(self):
        """After retraining, predict should use the model, not the heuristic."""
        rng = np.random.RandomState(42)
        n = 100
        ev = rng.uniform(1, 15, size=n)
        sentiment = rng.uniform(-1, 1, size=n)
        hours = rng.uniform(1, 48, size=n)
        sharp_count = rng.randint(1, 5, size=n)
        market = rng.randint(0, 4, size=n)
        X = np.column_stack([ev, sentiment, hours, sharp_count, market])
        win_prob = 0.3 + ev * 0.04
        y = (rng.random(n) < win_prob).astype(int)

        cal = ConfidenceCalibrator()
        cal._model = None
        cal.retrain(X, y)

        result = cal.predict(ev=10.0, sentiment=0.5, hours_to_game=12.0, sharp_book_count=3, market_type="h2h")
        assert 0.0 <= result <= 100.0

    def test_min_samples_constant(self):
        """MIN_SAMPLES should be 50 as specified."""
        assert MIN_SAMPLES == 50


# ---------------------------------------------------------------------------
# Module singleton
# ---------------------------------------------------------------------------


class TestSingleton:
    def test_module_singleton_exists(self):
        assert calibrator is not None
        assert isinstance(calibrator, ConfidenceCalibrator)
