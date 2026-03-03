"""Tests for the FinBERT sentiment model wrapper.

These tests verify the fallback behaviour (when FinBERT is not available)
and the aggregation logic in ``team_sentiment``.
"""

from __future__ import annotations

from unittest.mock import patch

import pytest

from app.ml.sentiment_model import _score_text, team_sentiment


# ---------------------------------------------------------------------------
# Fallback to 0.0 when pipeline is unavailable
# ---------------------------------------------------------------------------


class TestScoreText:
    """_score_text should return 0.0 when the pipeline is None."""

    @patch("app.ml.sentiment_model._get_pipeline", return_value=None)
    def test_returns_zero_when_no_pipeline(self, _mock):
        assert _score_text("any text") == 0.0

    @patch("app.ml.sentiment_model._get_pipeline")
    def test_positive_sentiment(self, mock_pipe):
        mock_pipe.return_value = lambda text: [[
            {"label": "positive", "score": 0.85},
            {"label": "negative", "score": 0.05},
            {"label": "neutral", "score": 0.10},
        ]]
        # pos(0.85) - neg(0.05) = 0.80
        assert _score_text("great win today") == 0.8


class TestTeamSentimentFallback:
    """When the FinBERT pipeline cannot be loaded, all scores must be 0.0."""

    def test_empty_articles(self):
        """No articles -> 0.0 regardless of pipeline state."""
        assert team_sentiment("Celtics", []) == 0.0

    @patch("app.ml.sentiment_model._get_pipeline", return_value=None)
    def test_fallback_zero(self, _mock):
        assert team_sentiment("Lakers", ["injury report"]) == 0.0

    @patch("app.ml.sentiment_model._get_pipeline", return_value=None)
    def test_dict_articles_fallback(self, _mock):
        """team_sentiment should accept dict articles and still fall back to 0.0."""
        articles = [{"title": "Lakers win big", "summary": "Great game", "content": ""}]
        assert team_sentiment("Lakers", articles) == 0.0

    @patch("app.ml.sentiment_model._get_pipeline", return_value=None)
    def test_mixed_articles_fallback(self, _mock):
        """Mix of string and dict articles should still fall back."""
        articles = [
            "Plain text article",
            {"title": "Dict article", "summary": "Summary here"},
        ]
        assert team_sentiment("Lakers", articles) == 0.0


# ---------------------------------------------------------------------------
# With a mock pipeline
# ---------------------------------------------------------------------------


class TestSentimentWithMockPipeline:
    """Use a mock pipeline to verify aggregation logic."""

    @staticmethod
    def _mock_pipeline(text):
        """Simulate FinBERT output based on keywords."""
        text_lower = text.lower()
        if "win" in text_lower or "strong" in text_lower or "star" in text_lower:
            return [[
                {"label": "positive", "score": 0.85},
                {"label": "neutral", "score": 0.10},
                {"label": "negative", "score": 0.05},
            ]]
        elif "injury" in text_lower or "loss" in text_lower or "suspend" in text_lower:
            return [[
                {"label": "positive", "score": 0.05},
                {"label": "neutral", "score": 0.15},
                {"label": "negative", "score": 0.80},
            ]]
        else:
            return [[
                {"label": "positive", "score": 0.30},
                {"label": "neutral", "score": 0.50},
                {"label": "negative", "score": 0.20},
            ]]

    def test_positive_sentiment(self):
        with patch("app.ml.sentiment_model._get_pipeline", return_value=self._mock_pipeline):
            result = team_sentiment("Lakers", ["Lakers win big"])
            # positive(0.85) - negative(0.05) = 0.80
            assert result == pytest.approx(0.80, abs=0.01)

    def test_negative_sentiment(self):
        with patch("app.ml.sentiment_model._get_pipeline", return_value=self._mock_pipeline):
            result = team_sentiment("Lakers", ["Star player injury report"])
            # positive(0.05) - negative(0.80) = -0.75
            assert result == pytest.approx(-0.75, abs=0.01)

    def test_mixed_sentiment_averages(self):
        with patch("app.ml.sentiment_model._get_pipeline", return_value=self._mock_pipeline):
            result = team_sentiment(
                "Lakers",
                [
                    "Lakers win big",         # +0.80
                    "Key player injury news",  # -0.75
                ],
            )
            expected = (0.80 + (-0.75)) / 2  # 0.025
            assert result == pytest.approx(expected, abs=0.05)

    def test_neutral_sentiment(self):
        with patch("app.ml.sentiment_model._get_pipeline", return_value=self._mock_pipeline):
            result = team_sentiment("Lakers", ["Regular season game scheduled"])
            # positive(0.30) - negative(0.20) = 0.10
            assert result == pytest.approx(0.10, abs=0.01)

    def test_dict_articles_with_mock_pipeline(self):
        """Dict articles should extract text and score properly."""
        with patch("app.ml.sentiment_model._get_pipeline", return_value=self._mock_pipeline):
            articles = [{"title": "Lakers win championship", "summary": "Big win for team"}]
            result = team_sentiment("Lakers", articles)
            # "Big win for team" -> positive
            assert result > 0
