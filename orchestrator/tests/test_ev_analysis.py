"""Tests for EV analysis math: american_to_decimal, decimal_to_american,
remove_vig, calculate_ev.

These mirror the TypeScript implementation in
``extensions/draft-claw/src/analysis.ts``.
"""

from __future__ import annotations

import pytest

from app.providers.base import american_to_decimal, decimal_to_american
from app.graphs.pick_generation import calculate_ev, decimal_to_implied, remove_vig


# ---------------------------------------------------------------------------
# american_to_decimal
# ---------------------------------------------------------------------------


class TestAmericanToDecimal:
    def test_positive_american(self):
        assert american_to_decimal(150) == pytest.approx(2.5, rel=1e-3)

    def test_negative_american(self):
        assert american_to_decimal(-200) == pytest.approx(1.5, rel=1e-3)

    def test_even_money(self):
        assert american_to_decimal(100) == pytest.approx(2.0, rel=1e-3)

    def test_heavy_favorite(self):
        # -500 -> 1.20
        assert american_to_decimal(-500) == pytest.approx(1.2, rel=1e-3)

    def test_big_underdog(self):
        # +500 -> 6.00
        assert american_to_decimal(500) == pytest.approx(6.0, rel=1e-3)

    def test_minus_110(self):
        # Standard juice line: -110 -> ~1.909
        assert american_to_decimal(-110) == pytest.approx(1.9091, rel=1e-2)


# ---------------------------------------------------------------------------
# decimal_to_american
# ---------------------------------------------------------------------------


class TestDecimalToAmerican:
    def test_underdog(self):
        # 2.50 -> +150
        assert decimal_to_american(2.5) == 150

    def test_favorite(self):
        # 1.50 -> -200
        assert decimal_to_american(1.5) == -200

    def test_even_money(self):
        # 2.00 -> +100
        assert decimal_to_american(2.0) == 100

    def test_roundtrip_positive(self):
        """american -> decimal -> american should roundtrip."""
        original = 175
        decimal = american_to_decimal(original)
        back = decimal_to_american(decimal)
        assert back == original

    def test_roundtrip_negative(self):
        original = -150
        decimal = american_to_decimal(original)
        back = decimal_to_american(decimal)
        assert back == original


# ---------------------------------------------------------------------------
# remove_vig
# ---------------------------------------------------------------------------


class TestRemoveVig:
    def test_two_way_market(self):
        """Standard -110 / -110 market should give ~50/50 after vig removal."""
        outcomes = [
            {"outcome_name": "Team A", "price": 1.9091},  # ~ -110
            {"outcome_name": "Team B", "price": 1.9091},
        ]
        probs = remove_vig(outcomes)
        assert probs["Team A"] == pytest.approx(0.5, rel=1e-2)
        assert probs["Team B"] == pytest.approx(0.5, rel=1e-2)

    def test_unbalanced_market(self):
        """Unbalanced market: -200/+170."""
        outcomes = [
            {"outcome_name": "Favorite", "price": 1.5},   # -200
            {"outcome_name": "Underdog", "price": 2.7},    # +170
        ]
        probs = remove_vig(outcomes)
        assert sum(probs.values()) == pytest.approx(1.0, abs=1e-4)
        assert probs["Favorite"] > probs["Underdog"]

    def test_three_way_market(self):
        """Three-way (soccer) market with draw."""
        outcomes = [
            {"outcome_name": "Home", "price": 2.10},
            {"outcome_name": "Draw", "price": 3.40},
            {"outcome_name": "Away", "price": 3.50},
        ]
        probs = remove_vig(outcomes)
        assert sum(probs.values()) == pytest.approx(1.0, abs=1e-3)
        assert probs["Home"] > probs["Draw"]
        assert probs["Home"] > probs["Away"]

    def test_empty_outcomes(self):
        assert remove_vig([]) == {}

    def test_american_odds_format(self):
        """remove_vig also accepts american_odds instead of price."""
        outcomes = [
            {"outcome_name": "Team A", "american_odds": -110},
            {"outcome_name": "Team B", "american_odds": -110},
        ]
        probs = remove_vig(outcomes)
        assert probs["Team A"] == pytest.approx(0.5, rel=1e-2)
        assert probs["Team B"] == pytest.approx(0.5, rel=1e-2)


# ---------------------------------------------------------------------------
# calculate_ev
# ---------------------------------------------------------------------------


class TestCalculateEV:
    def test_positive_ev(self):
        """Soft book offers 2.50, true probability is 50% -> EV = 25%."""
        ev = calculate_ev(2.50, 0.50)
        assert ev == pytest.approx(25.0, rel=1e-2)

    def test_negative_ev(self):
        """Soft book offers 1.80, true probability is 50% -> EV = -10%."""
        ev = calculate_ev(1.80, 0.50)
        assert ev == pytest.approx(-10.0, rel=1e-2)

    def test_zero_ev(self):
        """Fair odds: EV should be ~0."""
        # 2.0 at 50% -> EV = 0
        ev = calculate_ev(2.0, 0.50)
        assert ev == pytest.approx(0.0, abs=0.01)

    def test_realistic_nba_edge(self):
        """Realistic NBA scenario: DraftKings +150, sharp says 42% true prob."""
        soft_decimal = american_to_decimal(150)  # 2.50
        true_prob = 0.42
        ev = calculate_ev(soft_decimal, true_prob)
        # 2.50 * 0.42 - 1 = 0.05 -> 5.0%
        assert ev == pytest.approx(5.0, rel=1e-2)

    def test_ev_matches_typescript(self):
        """Verify the formula matches: (softOdds * trueProb - 1) * 100."""
        soft = 1.91  # ~ -110
        prob = 0.55
        expected = (1.91 * 0.55 - 1) * 100  # 5.05
        assert calculate_ev(soft, prob) == pytest.approx(expected, rel=1e-4)


# ---------------------------------------------------------------------------
# decimal_to_implied
# ---------------------------------------------------------------------------


class TestDecimalToImplied:
    def test_even_money(self):
        assert decimal_to_implied(2.0) == pytest.approx(0.5, rel=1e-3)

    def test_favorite(self):
        assert decimal_to_implied(1.5) == pytest.approx(0.6667, rel=1e-2)

    def test_underdog(self):
        assert decimal_to_implied(3.0) == pytest.approx(0.3333, rel=1e-2)
