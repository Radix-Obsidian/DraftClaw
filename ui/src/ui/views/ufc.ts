import { html } from "lit";
import { renderBettingCard } from "../components/betting-card";
import type { Pick } from "../types/picks";
import { MOCK_PICKS } from "../types/picks";

export type UfcViewProps = {
  loading: boolean;
  picks: Pick[];
  error: string | null;
  onRefresh: () => void;
};

export function renderUfcView(props: UfcViewProps) {
  const ufcPicks = (props.picks.length ? props.picks : MOCK_PICKS).filter(
    (p) => p.sport === "UFC"
  );

  return html`
    <div class="sport-view">
      <header class="sport-view__header">
        <div class="sport-view__title">
          <span class="sport-view__icon">🥊</span>
          <h1>UFC Picks</h1>
        </div>
        <p class="sport-view__subtitle">
          Upcoming fight card picks and prop bets
        </p>
      </header>

      ${props.error
        ? html`<div class="callout danger">${props.error}</div>`
        : ""}

      ${props.loading
        ? html`<div class="loading-state">Loading UFC picks...</div>`
        : ""}

      <div class="picks-grid picks-grid--full">
        ${ufcPicks.map((pick) => renderBettingCard(pick))}
        ${ufcPicks.length === 0 && !props.loading
          ? html`
              <div class="empty-state">
                <span class="empty-state__icon">🥊</span>
                <h3>No UFC Events This Week</h3>
                <p>Check back when a fight card is announced.</p>
              </div>
            `
          : ""}
      </div>
    </div>
  `;
}
