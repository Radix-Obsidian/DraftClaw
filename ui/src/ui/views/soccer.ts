import { html } from "lit";
import { renderBettingCard } from "../components/betting-card";
import type { Pick } from "../types/picks";
import { MOCK_PICKS } from "../types/picks";

export type SoccerViewProps = {
  loading: boolean;
  picks: Pick[];
  error: string | null;
  onRefresh: () => void;
};

export function renderSoccerView(props: SoccerViewProps) {
  const soccerPicks = (props.picks.length ? props.picks : MOCK_PICKS).filter(
    (p) => p.sport === "Soccer"
  );

  return html`
    <div class="sport-view">
      <header class="sport-view__header">
        <div class="sport-view__title">
          <span class="sport-view__icon">⚽</span>
          <h1>Soccer Picks</h1>
        </div>
        <p class="sport-view__subtitle">
          EPL, Champions League & top leagues betting picks
        </p>
      </header>

      ${props.error
        ? html`<div class="callout danger">${props.error}</div>`
        : ""}

      ${props.loading
        ? html`<div class="loading-state">Loading Soccer picks...</div>`
        : ""}

      <div class="picks-grid picks-grid--full">
        ${soccerPicks.map((pick) => renderBettingCard(pick))}
        ${soccerPicks.length === 0 && !props.loading
          ? html`
              <div class="empty-state">
                <span class="empty-state__icon">⚽</span>
                <h3>No Soccer Matches Today</h3>
                <p>Check back when matches are scheduled.</p>
              </div>
            `
          : ""}
      </div>
    </div>
  `;
}
