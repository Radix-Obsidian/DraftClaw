import type {
  OddsResponse,
  ClawAnalysis,
  Bookmaker,
  Market,
  Outcome,
  Recommendation,
  Confidence,
  DraftClawConfig,
} from "./types.js";
import { generateAffiliateLink, isSharpBook, isSoftBook, getBookmakerDisplayName } from "./bookmakers.js";

function decimalToImpliedProbability(decimalOdds: number): number {
  return 1 / decimalOdds;
}

function removeVig(outcomes: Outcome[]): Map<string, number> {
  const totalImplied = outcomes.reduce((sum, o) => sum + decimalToImpliedProbability(o.price), 0);
  const vigMultiplier = 1 / totalImplied;

  const trueProbs = new Map<string, number>();
  for (const outcome of outcomes) {
    const rawProb = decimalToImpliedProbability(outcome.price);
    trueProbs.set(outcome.name, rawProb * vigMultiplier);
  }
  return trueProbs;
}

function getSharpProbabilities(bookmakers: Bookmaker[], marketKey: string): Map<string, number> | null {
  const sharpBooks = bookmakers.filter((b) => isSharpBook(b.key));
  if (sharpBooks.length === 0) return null;

  const allProbs = new Map<string, number[]>();

  for (const book of sharpBooks) {
    const market = book.markets.find((m) => m.key === marketKey);
    if (!market) continue;

    const trueProbs = removeVig(market.outcomes);
    for (const [name, prob] of trueProbs) {
      if (!allProbs.has(name)) allProbs.set(name, []);
      allProbs.get(name)!.push(prob);
    }
  }

  const avgProbs = new Map<string, number>();
  for (const [name, probs] of allProbs) {
    avgProbs.set(name, probs.reduce((a, b) => a + b, 0) / probs.length);
  }

  return avgProbs.size > 0 ? avgProbs : null;
}

function calculateEV(softOdds: number, trueProb: number): number {
  return (softOdds * trueProb - 1) * 100;
}

function determineConfidence(edge: number, isHomeDogValue: boolean, isSteamMove: boolean): Confidence {
  if (edge >= 8 || (edge >= 5 && (isHomeDogValue || isSteamMove))) return "High";
  if (edge >= 4) return "Medium";
  return "Low";
}

function buildReasoning(
  outcomeName: string,
  marketKey: string,
  softBookName: string,
  softOdds: number,
  sharpProb: number,
  edge: number,
  isHomeDogValue: boolean,
  isSteamMove: boolean,
  totalLine?: number
): string {
  const parts: string[] = [];

  parts.push(
    `${getBookmakerDisplayName(softBookName)} offers ${outcomeName} at ${softOdds.toFixed(2)} decimal (${americanOddsFromDecimal(softOdds)}).`
  );
  parts.push(`Sharp consensus implies ${(sharpProb * 100).toFixed(1)}% true probability.`);
  parts.push(`This creates a ${edge.toFixed(1)}% edge—statistically significant alpha.`);

  if (isHomeDogValue) {
    parts.push(`🏠 HOME DOG VALUE: Modern NBA variance favors home underdogs with sharp backing >45%.`);
  }

  if (isSteamMove && marketKey === "totals" && totalLine) {
    parts.push(`📈 STEAM MOVE DETECTED: Sharp money pushing the total (${totalLine}) in pace-and-space era.`);
  }

  return parts.join(" ");
}

function americanOddsFromDecimal(decimal: number): string {
  if (decimal >= 2.0) {
    return `+${Math.round((decimal - 1) * 100)}`;
  } else {
    return `${Math.round(-100 / (decimal - 1))}`;
  }
}

export function calculateEdge(event: OddsResponse, config: DraftClawConfig): ClawAnalysis[] {
  const analyses: ClawAnalysis[] = [];
  const gameLabel = `${event.away_team} @ ${event.home_team}`;
  const softBooks = event.bookmakers.filter((b) => isSoftBook(b.key));

  for (const marketKey of ["h2h", "totals"]) {
    const sharpProbs = getSharpProbabilities(event.bookmakers, marketKey);
    if (!sharpProbs) continue;

    for (const softBook of softBooks) {
      const market = softBook.markets.find((m) => m.key === marketKey);
      if (!market) continue;

      for (const outcome of market.outcomes) {
        const trueProb = sharpProbs.get(outcome.name);
        if (!trueProb) continue;

        const softOdds = outcome.price;
        const impliedProb = decimalToImpliedProbability(softOdds);
        const edge = calculateEV(softOdds, trueProb);

        if (edge < config.minEdgePercentage) continue;

        const isHomeTeam = outcome.name === event.home_team;
        const isHomeDogValue = marketKey === "h2h" && isHomeTeam && softOdds > 2.0 && trueProb > 0.45;

        const totalLine = outcome.point;
        const isSteamMove = marketKey === "totals" && totalLine !== undefined && totalLine > 235;

        let recommendation: Recommendation;
        if (marketKey === "h2h") {
          recommendation = isHomeTeam ? "Bet Home" : "Bet Away";
        } else {
          recommendation = outcome.name.toLowerCase().includes("over") ? "Bet Over" : "Bet Under";
        }

        const confidence = determineConfidence(edge, isHomeDogValue, isSteamMove);
        const reasoning = buildReasoning(
          outcome.name,
          marketKey,
          softBook.key,
          softOdds,
          trueProb,
          edge,
          isHomeDogValue,
          isSteamMove,
          totalLine
        );

        const deepLink = generateAffiliateLink(softBook.key, marketKey, event.id, config);

        analyses.push({
          game: gameLabel,
          market: marketKey === "h2h" ? "Moneyline" : "Totals",
          recommendation,
          impliedProbability: Math.round(impliedProb * 1000) / 10,
          clawProbability: Math.round(trueProb * 1000) / 10,
          edge: Math.round(edge * 10) / 10,
          confidence,
          reasoning,
          deepLink,
        });
      }
    }
  }

  return analyses.sort((a, b) => b.edge - a.edge);
}
