import axios from "axios";
import type { OddsResponse, ClawAnalysis, DraftClawConfig } from "./types.js";
import { calculateEdge } from "./analysis.js";

const MOCK_EVENT: OddsResponse = {
  id: "nba-2024-celtics-nuggets-001",
  sport_key: "basketball_nba",
  sport_title: "NBA",
  commence_time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
  home_team: "Denver Nuggets",
  away_team: "Boston Celtics",
  bookmakers: [
    {
      key: "pinnacle",
      title: "Pinnacle",
      last_update: new Date().toISOString(),
      markets: [
        {
          key: "h2h",
          last_update: new Date().toISOString(),
          outcomes: [
            { name: "Denver Nuggets", price: 1.45 }, // -220 equivalent
            { name: "Boston Celtics", price: 2.95 },
          ],
        },
        {
          key: "totals",
          last_update: new Date().toISOString(),
          outcomes: [
            { name: "Over", price: 1.87, point: 238.5 },
            { name: "Under", price: 1.95, point: 238.5 },
          ],
        },
      ],
    },
    {
      key: "fanduel",
      title: "FanDuel",
      last_update: new Date().toISOString(),
      markets: [
        {
          key: "h2h",
          last_update: new Date().toISOString(),
          outcomes: [
            { name: "Denver Nuggets", price: 1.67 }, // -150 equivalent - MASSIVE DISCREPANCY
            { name: "Boston Celtics", price: 2.25 },
          ],
        },
        {
          key: "totals",
          last_update: new Date().toISOString(),
          outcomes: [
            { name: "Over", price: 1.91, point: 236.5 },
            { name: "Under", price: 1.91, point: 236.5 },
          ],
        },
      ],
    },
    {
      key: "draftkings",
      title: "DraftKings",
      last_update: new Date().toISOString(),
      markets: [
        {
          key: "h2h",
          last_update: new Date().toISOString(),
          outcomes: [
            { name: "Denver Nuggets", price: 1.55 }, // -180 - Still value vs Pinnacle
            { name: "Boston Celtics", price: 2.55 },
          ],
        },
        {
          key: "totals",
          last_update: new Date().toISOString(),
          outcomes: [
            { name: "Over", price: 1.95, point: 237.0 },
            { name: "Under", price: 1.87, point: 237.0 },
          ],
        },
      ],
    },
  ],
};

export class DraftClawClient {
  private config: DraftClawConfig;

  constructor(config: DraftClawConfig) {
    this.config = config;
  }

  async fetchOdds(): Promise<OddsResponse[]> {
    if (this.config.mockMode) {
      return [MOCK_EVENT];
    }

    try {
      const response = await axios.get<OddsResponse[]>(
        "https://api.the-odds-api.com/v4/sports/basketball_nba/odds",
        {
          params: {
            apiKey: this.config.apiKey,
            regions: "us",
            markets: "h2h,totals",
            bookmakers: "pinnacle,lowvig,fanduel,draftkings,betmgm",
            oddsFormat: "decimal",
          },
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to fetch odds: ${error.message}`);
      }
      throw error;
    }
  }

  async getClawSheet(): Promise<{
    timestamp: string;
    mode: "mock" | "live";
    analyses: ClawAnalysis[];
    summary: {
      totalGames: number;
      opportunitiesFound: number;
      highConfidence: number;
    };
  }> {
    const events = await this.fetchOdds();
    const allAnalyses: ClawAnalysis[] = [];

    for (const event of events) {
      const analyses = calculateEdge(event, this.config);
      allAnalyses.push(...analyses);
    }

    return {
      timestamp: new Date().toISOString(),
      mode: this.config.mockMode ? "mock" : "live",
      analyses: allAnalyses,
      summary: {
        totalGames: events.length,
        opportunitiesFound: allAnalyses.length,
        highConfidence: allAnalyses.filter((a) => a.confidence === "High").length,
      },
    };
  }
}
