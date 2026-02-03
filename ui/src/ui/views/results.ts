import { html } from "lit";
import type { TickerItem } from "../types/picks";
import { MOCK_TICKER } from "../types/picks";

export type ResultsViewProps = {
  loading: boolean;
  results: TickerItem[];
  error: string | null;
  onRefresh: () => void;
};

function formatTimestamp(ts: number): string {
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

function calculateStats(results: TickerItem[]) {
  const wins = results.filter((r) => r.type === "win").length;
  const losses = results.filter((r) => r.type === "loss").length;
  const total = wins + losses;
  const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : "0.0";
  return { wins, losses, total, winRate };
}

export function renderResultsView(props: ResultsViewProps) {
  const results = props.results.length ? props.results : MOCK_TICKER;
  const stats = calculateStats(results);

  return html`
    <div class="results-view">
      <header class="results-view__header">
        <div class="results-view__title">
          <span class="results-view__icon">📊</span>
          <h1>Results</h1>
        </div>
        <p class="results-view__subtitle">Track your wins, losses, and ROI</p>
      </header>

      ${props.error
        ? html`<div class="callout danger">${props.error}</div>`
        : ""}

      <div class="stats-grid">
        <div class="stat-card stat-card--wins">
          <div class="stat-card__value">${stats.wins}</div>
          <div class="stat-card__label">Wins</div>
        </div>
        <div class="stat-card stat-card--losses">
          <div class="stat-card__value">${stats.losses}</div>
          <div class="stat-card__label">Losses</div>
        </div>
        <div class="stat-card stat-card--rate">
          <div class="stat-card__value">${stats.winRate}%</div>
          <div class="stat-card__label">Win Rate</div>
        </div>
      </div>

      <section class="results-list">
        <h2 class="results-list__title">Recent Results</h2>
        <div class="results-list__items">
          ${results.map(
            (result) => html`
              <div class="result-item result-item--${result.type}">
                <span class="result-item__text">${result.text}</span>
                <span class="result-item__time"
                  >${formatTimestamp(result.timestamp)}</span
                >
              </div>
            `
          )}
        </div>
      </section>
    </div>
  `;
}
