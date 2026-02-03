import { html } from "lit";
import type { TickerItem } from "../types/picks";

export function renderTickerTape(items: TickerItem[]) {
  if (!items.length) {
    return html``;
  }

  const tickerContent = items.map((item) => {
    const typeClass = `ticker-item--${item.type}`;
    return html`<span class="ticker-item ${typeClass}">${item.text}</span>`;
  });

  return html`
    <div class="ticker-tape">
      <div class="ticker-tape__track">
        <div class="ticker-tape__content">
          ${tickerContent}
          ${tickerContent}
        </div>
      </div>
    </div>
  `;
}
