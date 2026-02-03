import { html } from "lit";
import { renderBettingCard } from "../components/betting-card";
import { renderMoneyballMeter } from "../components/moneyball-meter";
import { renderTickerTape } from "../components/ticker-tape";
import type { DraftClawBriefing, Pick } from "../types/picks";
import { MOCK_BRIEFING } from "../types/picks";

export type DailySheetProps = {
  loading: boolean;
  briefing: DraftClawBriefing | null;
  error: string | null;
  onRefresh: () => void;
};

function filterPicksByType(picks: Pick[], type: Pick["type"]): Pick[] {
  return picks.filter((p) => p.type === type);
}

export function renderDailySheet(props: DailySheetProps) {
  const briefing = props.briefing ?? MOCK_BRIEFING;
  const locks = filterPicksByType(briefing.picks, "lock");
  const longshots = filterPicksByType(briefing.picks, "longshot");
  const traps = filterPicksByType(briefing.picks, "trap");

  return html`
    ${renderTickerTape(briefing.ticker)}

    <div class="daily-sheet">
      ${renderMoneyballMeter(briefing.confidenceLevel)}

      ${props.error
        ? html`<div class="callout danger">${props.error}</div>`
        : ""}

      <section class="picks-section">
        <h2 class="picks-section__title">🔒 Today's Locks</h2>
        <div class="picks-grid">
          ${locks.map((pick) => renderBettingCard(pick))}
          ${locks.length === 0 ? html`<p class="muted">No locks today. Check back later.</p>` : ""}
        </div>
      </section>

      <section class="picks-section">
        <h2 class="picks-section__title">🎲 Longshots</h2>
        <div class="picks-grid">
          ${longshots.map((pick) => renderBettingCard(pick))}
          ${longshots.length === 0 ? html`<p class="muted">No longshots today.</p>` : ""}
        </div>
      </section>

      <section class="picks-section">
        <h2 class="picks-section__title">⚠️ Traps to Avoid</h2>
        <div class="picks-grid">
          ${traps.map((pick) => renderBettingCard(pick))}
          ${traps.length === 0 ? html`<p class="muted">No traps identified today.</p>` : ""}
        </div>
      </section>

      <footer class="daily-sheet__footer">
        <p class="disclaimer">
          DraftClaw provides sports betting analysis for entertainment purposes only. 
          Always gamble responsibly. Must be 21+ and located in a legal betting state.
        </p>
      </footer>
    </div>
  `;
}
