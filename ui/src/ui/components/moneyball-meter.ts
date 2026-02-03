import { html } from "lit";
import type { ConfidenceLevel } from "../types/picks";

function getConfidencePercent(level: ConfidenceLevel): number {
  switch (level) {
    case "HIGH":
      return 85;
    case "MEDIUM":
      return 55;
    case "LOW":
      return 25;
  }
}

function getConfidenceClass(level: ConfidenceLevel): string {
  switch (level) {
    case "HIGH":
      return "meter--high";
    case "MEDIUM":
      return "meter--medium";
    case "LOW":
      return "meter--low";
  }
}

export function renderMoneyballMeter(level: ConfidenceLevel) {
  const percent = getConfidencePercent(level);
  const meterClass = getConfidenceClass(level);

  return html`
    <div class="moneyball-meter ${meterClass}">
      <div class="moneyball-meter__header">
        <span class="moneyball-meter__icon">🎯</span>
        <span class="moneyball-meter__label">TONIGHT'S CONFIDENCE:</span>
        <span class="moneyball-meter__level">${level}</span>
      </div>
      <div class="moneyball-meter__bar">
        <div class="moneyball-meter__fill" style="width: ${percent}%"></div>
      </div>
      <div class="moneyball-meter__percent">${percent}%</div>
    </div>
  `;
}
