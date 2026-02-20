import { html } from "lit";
import { renderBettingCard } from "../components/betting-card";
import type { Pick } from "../types/picks";
import { MOCK_PICKS } from "../types/picks";

export type NbaViewProps = {
  loading: boolean;
  picks: Pick[];
  error: string | null;
  onRefresh: () => void;
};

export function renderNbaView(props: NbaViewProps) {
  const nbaPicks = (props.picks.length ? props.picks : MOCK_PICKS).filter(
    (p) => p.sport === "NBA"
  );

  return html`
    <div class="sport-view">
      <header class="sport-view__header">
        <div class="sport-view__title">
          <span class="sport-view__icon">🏀</span>
          <h1>NBA Picks</h1>
        </div>
        <p class="sport-view__subtitle">
          Today's NBA betting picks, spreads, and totals
        </p>
      </header>

      ${props.error
        ? html`<div class="callout danger">${props.error}</div>`
        : ""}

      ${props.loading
        ? html`<div class="loading-state">Loading NBA picks...</div>`
        : ""}

      <div class="picks-grid picks-grid--full">
        ${nbaPicks.map((pick) => renderBettingCard(pick))}
        ${nbaPicks.length === 0 && !props.loading
          ? html`
              <div class="empty-state">
                <span class="empty-state__icon">🏀</span>
                <h3>No NBA Games Today</h3>
                <p>Check back when games are scheduled.</p>
              </div>
            `
          : ""}
      </div>
    </div>
  `;
}
