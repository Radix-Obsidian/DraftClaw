import { html } from "lit";
import type { Pick, PickType } from "../types/picks";
import { AFFILIATE_LINKS } from "../types/picks";

function getPickTypeLabel(type: PickType): string {
  switch (type) {
    case "lock":
      return "🔒 THE LOCK";
    case "longshot":
      return "🎲 THE LONGSHOT";
    case "trap":
      return "⚠️ THE TRAP";
  }
}

function getPickTypeClass(type: PickType): string {
  switch (type) {
    case "lock":
      return "betting-card--lock";
    case "longshot":
      return "betting-card--longshot";
    case "trap":
      return "betting-card--trap";
  }
}

function formatClawEdge(edge: number): string {
  const prefix = edge >= 0 ? "+" : "";
  return `${prefix}${edge.toFixed(1)}%`;
}

export function renderBettingCard(pick: Pick) {
  const typeLabel = getPickTypeLabel(pick.type);
  const typeClass = getPickTypeClass(pick.type);
  const edgeClass = pick.clawEdge >= 0 ? "edge--positive" : "edge--negative";

  const affiliateButtons = Object.entries(pick.affiliateLinks)
    .filter(([_, url]) => url)
    .map(([key, url]) => {
      const affiliate = AFFILIATE_LINKS[key as keyof typeof AFFILIATE_LINKS];
      return html`
        <a
          href="${url}"
          target="_blank"
          rel="noopener noreferrer"
          class="betting-card__cta"
        >
          🎰 BET NOW @ ${affiliate.name}
        </a>
      `;
    });

  return html`
    <article class="betting-card ${typeClass}">
      <header class="betting-card__header">
        <span class="betting-card__type">${typeLabel}</span>
        <span class="betting-card__sport">${pick.sport}</span>
      </header>

      <div class="betting-card__matchup">
        ${pick.matchup}
      </div>

      ${pick.gameTime ? html`<div class="betting-card__time">${pick.gameTime}</div>` : ""}

      <div class="betting-card__selection">
        ${pick.selection}
        <span class="betting-card__odds">(${pick.odds})</span>
      </div>

      <div class="betting-card__edge ${edgeClass}">
        ⚡ CLAW EDGE: ${formatClawEdge(pick.clawEdge)}
      </div>

      <div class="betting-card__confidence">
        <div class="confidence-bar">
          <div class="confidence-bar__fill" style="width: ${pick.confidence}%"></div>
        </div>
        <span class="confidence-label">${pick.confidence}% Confidence</span>
      </div>

      <blockquote class="betting-card__take">
        "${pick.anchorTake}"
      </blockquote>

      <div class="betting-card__actions">
        ${affiliateButtons}
      </div>
    </article>
  `;
}
