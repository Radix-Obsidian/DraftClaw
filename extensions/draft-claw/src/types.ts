export interface Outcome {
  name: string;
  price: number; // Decimal odds (e.g., 1.67 for -150)
  point?: number; // For spreads/totals
}

export interface Market {
  key: string; // "h2h", "spreads", "totals"
  last_update: string;
  outcomes: Outcome[];
}

export interface Bookmaker {
  key: string; // "fanduel", "draftkings", "pinnacle", etc.
  title: string;
  last_update: string;
  markets: Market[];
}

export interface OddsResponse {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
}

export type Recommendation = "Bet Home" | "Bet Away" | "Bet Over" | "Bet Under";
export type Confidence = "High" | "Medium" | "Low";

export interface ClawAnalysis {
  game: string;
  market: string;
  recommendation: Recommendation;
  impliedProbability: number; // Soft book implied probability
  clawProbability: number; // Sharp-derived "true" probability
  edge: number; // The % advantage
  confidence: Confidence;
  reasoning: string; // Technical NBA jargon logic
  deepLink: string;
}

export interface DraftClawConfig {
  apiKey: string;
  mockMode: boolean;
  minEdgePercentage: number;
  affiliates: {
    fanduel?: string;
    draftkings?: string;
  };
}
