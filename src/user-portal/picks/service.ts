import { supabase, type DbPick, type DbEvent } from "../db/supabase-client.js";

export type Sport = "NBA" | "UFC" | "Soccer";
export type PickType = "lock" | "longshot" | "trap";

export interface Pick {
  id: string;
  sport: Sport;
  type: PickType;
  matchup: string;
  selection: string;
  odds: string;
  clawEdge: number;
  anchorTake: string;
  confidence: number;
  gameTime: string | null;
  affiliateLinks: Record<string, string>;
  generatedAt: string;
}

export interface PickDetail extends Pick {
  eventId: string | null;
  pickDescription: string;
  analysis: string | null;
  expectedValue: number | null;
  recommendedUnits: number | null;
  bestOdds: number | null;
  bestSportsbook: string | null;
  sharpLine: number | null;
  retailLine: number | null;
  edgePercentage: number | null;
  isFeatured: boolean;
  result: string | null;
  expiresAt: string | null;
  settledAt: string | null;
  event: {
    homeTeam: string;
    awayTeam: string;
    commenceTime: string;
    status: string;
    league: string | null;
  } | null;
}

export interface TickerItem {
  id: string;
  text: string;
  type: "win" | "loss" | "pending";
  timestamp: string;
}

export interface DailyBriefing {
  date: string;
  confidenceLevel: "HIGH" | "MEDIUM" | "LOW";
  summary: string | null;
  picks: Pick[];
  ticker: TickerItem[];
}

function dbPickToPick(dbPick: DbPick): Pick {
  return {
    id: dbPick.id,
    sport: dbPick.sport,
    type: dbPick.type,
    matchup: dbPick.matchup,
    selection: dbPick.selection,
    odds: dbPick.odds,
    clawEdge: dbPick.claw_edge,
    anchorTake: dbPick.anchor_take,
    confidence: dbPick.confidence,
    gameTime: dbPick.game_time,
    affiliateLinks: dbPick.affiliate_links as Record<string, string>,
    generatedAt: dbPick.generated_at,
  };
}

export class PicksService {
  async getActivePicks(sport?: Sport): Promise<Pick[]> {
    let query = supabase
      .from("picks")
      .select("*")
      .eq("is_active", true)
      .order("generated_at", { ascending: false });

    if (sport) {
      query = query.eq("sport", sport);
    }

    const { data, error } = await query;

    if (error || !data) {
      console.error("Failed to fetch picks:", error);
      return [];
    }

    return (data as DbPick[]).map(dbPickToPick);
  }

  async getPicksBySport(sport: Sport): Promise<Pick[]> {
    return this.getActivePicks(sport);
  }

  async getPicksByType(type: PickType): Promise<Pick[]> {
    const { data, error } = await supabase
      .from("picks")
      .select("*")
      .eq("is_active", true)
      .eq("type", type)
      .order("confidence", { ascending: false });

    if (error || !data) {
      return [];
    }

    return (data as DbPick[]).map(dbPickToPick);
  }

  async getTicker(): Promise<TickerItem[]> {
    const { data, error } = await supabase
      .from("ticker_items")
      .select("*")
      .order("result_timestamp", { ascending: false })
      .limit(20);

    if (error || !data) {
      return [];
    }

    return data.map((item) => ({
      id: item.id,
      text: item.text,
      type: item.type as "win" | "loss" | "pending",
      timestamp: item.result_timestamp,
    }));
  }

  async getDailyBriefing(): Promise<DailyBriefing> {
    const today = new Date().toISOString().split("T")[0];

    // Get or create today's briefing
    let { data: briefing, error } = await supabase
      .from("daily_briefings")
      .select("*")
      .eq("date", today)
      .single();

    if (error || !briefing) {
      // Return default briefing if none exists
      const picks = await this.getActivePicks();
      const ticker = await this.getTicker();

      return {
        date: today,
        confidenceLevel: this.calculateConfidenceLevel(picks),
        summary: null,
        picks,
        ticker,
      };
    }

    const picks = await this.getActivePicks();
    const ticker = await this.getTicker();

    return {
      date: briefing.date,
      confidenceLevel: briefing.confidence_level as "HIGH" | "MEDIUM" | "LOW",
      summary: briefing.summary,
      picks,
      ticker,
    };
  }

  async createPick(pick: Omit<Pick, "id" | "generatedAt">): Promise<Pick | null> {
    const { data, error } = await supabase
      .from("picks")
      .insert({
        sport: pick.sport,
        type: pick.type,
        matchup: pick.matchup,
        selection: pick.selection,
        odds: pick.odds,
        claw_edge: pick.clawEdge,
        anchor_take: pick.anchorTake,
        confidence: pick.confidence,
        game_time: pick.gameTime,
        affiliate_links: pick.affiliateLinks,
        is_active: true,
      })
      .select()
      .single();

    if (error || !data) {
      console.error("Failed to create pick:", error);
      return null;
    }

    return dbPickToPick(data as DbPick);
  }

  async deactivatePick(pickId: string): Promise<boolean> {
    const { error } = await supabase
      .from("picks")
      .update({ is_active: false })
      .eq("id", pickId);

    return !error;
  }

  async addTickerItem(item: Omit<TickerItem, "id" | "timestamp">): Promise<TickerItem | null> {
    const { data, error } = await supabase
      .from("ticker_items")
      .insert({
        text: item.text,
        type: item.type,
      })
      .select()
      .single();

    if (error || !data) {
      console.error("Failed to add ticker item:", error);
      return null;
    }

    return {
      id: data.id,
      text: data.text,
      type: data.type,
      timestamp: data.result_timestamp,
    };
  }

  async getPickById(pickId: string): Promise<PickDetail | null> {
    const { data: pick, error: pickError } = await supabase
      .from("picks")
      .select(`
        *,
        events (
          home_team,
          away_team,
          commence_time,
          status,
          league
        )
      `)
      .eq("id", pickId)
      .single();

    if (pickError || !pick) {
      console.error("Failed to fetch pick:", pickError);
      return null;
    }

    const event = pick.events ? {
      homeTeam: pick.events.home_team,
      awayTeam: pick.events.away_team,
      commenceTime: pick.events.commence_time,
      status: pick.events.status,
      league: pick.events.league
    } : null;

    return {
      id: pick.id,
      sport: pick.sport,
      type: pick.type,
      matchup: pick.matchup || `${event?.awayTeam} @ ${event?.homeTeam}` || "TBD",
      selection: pick.selection,
      odds: pick.odds,
      clawEdge: pick.claw_edge,
      anchorTake: pick.anchor_take,
      confidence: pick.confidence,
      gameTime: pick.game_time,
      affiliateLinks: pick.affiliate_links as Record<string, string>,
      generatedAt: pick.generated_at,
      eventId: pick.event_id,
      pickDescription: pick.pick_description,
      analysis: pick.analysis,
      expectedValue: pick.expected_value,
      recommendedUnits: pick.recommended_units,
      bestOdds: pick.best_odds,
      bestSportsbook: pick.best_sportsbook,
      sharpLine: pick.sharp_line,
      retailLine: pick.retail_line,
      edgePercentage: pick.edge_percentage,
      isFeatured: pick.is_featured,
      result: pick.result,
      expiresAt: pick.expires_at,
      settledAt: pick.settled_at,
      event
    };
  }

  private calculateConfidenceLevel(picks: Pick[]): "HIGH" | "MEDIUM" | "LOW" {
    if (picks.length === 0) return "LOW";

    const avgConfidence = picks.reduce((sum, p) => sum + p.confidence, 0) / picks.length;
    const locks = picks.filter((p) => p.type === "lock").length;

    if (avgConfidence >= 70 && locks >= 2) return "HIGH";
    if (avgConfidence >= 50 || locks >= 1) return "MEDIUM";
    return "LOW";
  }
}

export const picksService = new PicksService();
