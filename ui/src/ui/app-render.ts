import { html, nothing } from "lit";
import type { AppViewState } from "./app-view-state";
import { renderTab } from "./app-render.helpers";
import { icons } from "./icons";
import { TAB_GROUPS, subtitleForTab, titleForTab } from "./navigation";
import { renderDailySheet } from "./views/daily-sheet";
import { renderNbaView } from "./views/nba";
import { renderUfcView } from "./views/ufc";
import { renderSoccerView } from "./views/soccer";
import { renderResultsView } from "./views/results";
import { MOCK_BRIEFING, MOCK_TICKER, MOCK_PICKS } from "./types/picks";

export function renderApp(state: AppViewState) {
  return html`
    <div class="shell ${state.settings.navCollapsed ? "shell--nav-collapsed" : ""}">
      <header class="topbar">
        <div class="topbar-left">
          <button
            class="nav-collapse-toggle"
            @click=${() =>
              state.applySettings({
                ...state.settings,
                navCollapsed: !state.settings.navCollapsed,
              })}
            title="${state.settings.navCollapsed ? "Expand sidebar" : "Collapse sidebar"}"
            aria-label="${state.settings.navCollapsed ? "Expand sidebar" : "Collapse sidebar"}"
          >
            <span class="nav-collapse-toggle__icon">${icons.menu}</span>
          </button>
          <div class="brand">
            <div class="brand-logo">
              <img src="/draftclaw-icon.png" alt="DraftClaw" />
            </div>
            <div class="brand-text">
              <div class="brand-title">DRAFTCLAW</div>
              <div class="brand-sub">Sports Intelligence</div>
            </div>
          </div>
        </div>
        <div class="topbar-status">
          <div class="pill" style="background: var(--accent-subtle); border-color: var(--accent);">
            <span style="color: var(--accent);">⚡</span>
            <span style="color: var(--accent); font-weight: 600;">LIVE</span>
          </div>
        </div>
      </header>
      <aside class="nav ${state.settings.navCollapsed ? "nav--collapsed" : ""}">
        ${TAB_GROUPS.map((group) => {
          const isGroupCollapsed = state.settings.navGroupsCollapsed[group.label] ?? false;
          const hasActiveTab = group.tabs.some((tab) => tab === state.tab);
          return html`
            <div class="nav-group ${isGroupCollapsed && !hasActiveTab ? "nav-group--collapsed" : ""}">
              <button
                class="nav-label"
                @click=${() => {
                  const next = { ...state.settings.navGroupsCollapsed };
                  next[group.label] = !isGroupCollapsed;
                  state.applySettings({
                    ...state.settings,
                    navGroupsCollapsed: next,
                  });
                }}
                aria-expanded=${!isGroupCollapsed}
              >
                <span class="nav-label__text">${group.label}</span>
                <span class="nav-label__chevron">${isGroupCollapsed ? "+" : "−"}</span>
              </button>
              <div class="nav-group__items">
                ${group.tabs.map((tab) => renderTab(state, tab))}
              </div>
            </div>
          `;
        })}
        <div class="nav-group nav-group--links">
          <div class="nav-label nav-label--static">
            <span class="nav-label__text">Resources</span>
          </div>
          <div class="nav-group__items">
            <a
              class="nav-item nav-item--external"
              href="https://docs.draftclaw.ai"
              target="_blank"
              rel="noreferrer"
              title="Docs (opens in new tab)"
            >
              <span class="nav-item__icon" aria-hidden="true">${icons.book}</span>
              <span class="nav-item__text">Docs</span>
            </a>
          </div>
        </div>
      </aside>
      <main class="content">
        <section class="content-header">
          <div>
            <div class="page-title">${titleForTab(state.tab)}</div>
            <div class="page-sub">${subtitleForTab(state.tab)}</div>
          </div>
        </section>

        ${
          state.tab === "daily-sheet"
            ? renderDailySheet({
                loading: false,
                briefing: MOCK_BRIEFING,
                error: null,
                onRefresh: () => {},
              })
            : nothing
        }

        ${
          state.tab === "nba"
            ? renderNbaView({
                loading: false,
                picks: MOCK_PICKS,
                error: null,
                onRefresh: () => {},
              })
            : nothing
        }

        ${
          state.tab === "ufc"
            ? renderUfcView({
                loading: false,
                picks: MOCK_PICKS,
                error: null,
                onRefresh: () => {},
              })
            : nothing
        }

        ${
          state.tab === "soccer"
            ? renderSoccerView({
                loading: false,
                picks: MOCK_PICKS,
                error: null,
                onRefresh: () => {},
              })
            : nothing
        }

        ${
          state.tab === "results"
            ? renderResultsView({
                loading: false,
                results: MOCK_TICKER,
                error: null,
                onRefresh: () => {},
              })
            : nothing
        }
      </main>
    </div>
  `;
}
