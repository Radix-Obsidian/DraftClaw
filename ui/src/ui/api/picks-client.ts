import type { DraftClawBriefing, Pick, TickerItem } from "../types/picks";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    count: number;
    sport?: string;
    type?: string;
    timestamp: string;
  };
  error?: string;
}

class PicksApiClient {
  private baseUrl: string;
  private lastFetchTime: number = 0;
  private cooldownMs: number = 10000; // 10 second cooldown between refreshes

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async fetch<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}/api/picks${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const json: ApiResponse<T> = await response.json();

    if (!json.success) {
      throw new Error(json.error || "Unknown API error");
    }

    return json.data;
  }

  canRefresh(): boolean {
    return Date.now() - this.lastFetchTime >= this.cooldownMs;
  }

  getRemainingCooldown(): number {
    const remaining = this.cooldownMs - (Date.now() - this.lastFetchTime);
    return Math.max(0, remaining);
  }

  async getAllPicks(): Promise<Pick[]> {
    this.lastFetchTime = Date.now();
    return this.fetch<Pick[]>("/");
  }

  async getNbaPicks(): Promise<Pick[]> {
    this.lastFetchTime = Date.now();
    return this.fetch<Pick[]>("/nba");
  }

  async getUfcPicks(): Promise<Pick[]> {
    this.lastFetchTime = Date.now();
    return this.fetch<Pick[]>("/ufc");
  }

  async getSoccerPicks(): Promise<Pick[]> {
    this.lastFetchTime = Date.now();
    return this.fetch<Pick[]>("/soccer");
  }

  async getLocks(): Promise<Pick[]> {
    return this.fetch<Pick[]>("/locks");
  }

  async getLongshots(): Promise<Pick[]> {
    return this.fetch<Pick[]>("/longshots");
  }

  async getTraps(): Promise<Pick[]> {
    return this.fetch<Pick[]>("/traps");
  }

  async getTicker(): Promise<TickerItem[]> {
    return this.fetch<TickerItem[]>("/ticker");
  }

  async getBriefing(): Promise<DraftClawBriefing> {
    this.lastFetchTime = Date.now();
    return this.fetch<DraftClawBriefing>("/briefing");
  }
}

export const picksClient = new PicksApiClient();
export default picksClient;
