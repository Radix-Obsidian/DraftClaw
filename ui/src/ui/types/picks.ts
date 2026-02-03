export type Sport = "NBA" | "UFC" | "Soccer";
export type PickType = "lock" | "longshot" | "trap";
export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

export interface AffiliateLinks {
  fanduel?: string;
  draftkings?: string;
  betmgm?: string;
}

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
  affiliateLinks: AffiliateLinks;
  gameTime?: string;
}

export interface TickerItem {
  id: string;
  text: string;
  type: "win" | "loss" | "pending";
  timestamp: number;
}

export interface DraftClawBriefing {
  date: string;
  confidenceLevel: ConfidenceLevel;
  picks: Pick[];
  ticker: TickerItem[];
}

export const AFFILIATE_LINKS = {
  fanduel: {
    base: "https://fanduel.com/",
    name: "FanDuel",
  },
  draftkings: {
    base: "https://draftkings.com/",
    name: "DraftKings",
  },
  betmgm: {
    base: "https://betmgm.com/",
    name: "BetMGM",
  },
} as const;

export const MOCK_PICKS: Pick[] = [
  {
    id: "1",
    sport: "NBA",
    type: "lock",
    matchup: "Lakers vs Warriors",
    selection: "Lakers -4.5",
    odds: "-110",
    clawEdge: 12.4,
    anchorTake:
      "The Warriors are cooked. Curry's ankle is questionable and the Lakers are 8-2 ATS at home this month. LeBron is locked in.",
    confidence: 85,
    gameTime: "7:30 PM ET",
    affiliateLinks: { 
      fanduel: "https://fanduel.com/", 
      draftkings: "https://draftkings.com/", 
      betmgm: "https://betmgm.com/" 
    },
  },
  {
    id: "2",
    sport: "UFC",
    type: "longshot",
    matchup: "UFC 315: Adesanya vs Pereira III",
    selection: "Adesanya by KO Rd 2",
    odds: "+450",
    clawEdge: 8.2,
    anchorTake:
      "Izzy's been studying tape. Pereira leaves his chin exposed when throwing the left hook. If Adesanya can slip it, lights out.",
    confidence: 42,
    gameTime: "Saturday 10 PM ET",
    affiliateLinks: { 
      fanduel: "https://fanduel.com/", 
      draftkings: "https://draftkings.com/" 
    },
  },
  {
    id: "3",
    sport: "NBA",
    type: "trap",
    matchup: "Celtics vs Heat",
    selection: "FADE: Celtics -8.5",
    odds: "-110",
    clawEdge: -5.1,
    anchorTake:
      "Public is all over Boston here but Miami has covered 6 of their last 7 as underdogs. Butler is back and hungry. Take the points or stay away.",
    confidence: 72,
    gameTime: "8:00 PM ET",
    affiliateLinks: { 
      fanduel: "https://fanduel.com/", 
      draftkings: "https://draftkings.com/", 
      betmgm: "https://betmgm.com/" 
    },
  },
  {
    id: "4",
    sport: "Soccer",
    type: "lock",
    matchup: "Arsenal vs Manchester City",
    selection: "Under 2.5 Goals",
    odds: "-105",
    clawEdge: 11.2,
    anchorTake:
      "Big match energy means tight defense from both sides. Last 5 meetings have all had 2 or fewer goals. Both managers prioritize not losing.",
    confidence: 82,
    gameTime: "Sunday 11:30 AM ET",
    affiliateLinks: { 
      fanduel: "https://fanduel.com/", 
      draftkings: "https://draftkings.com/", 
      betmgm: "https://betmgm.com/" 
    },
  },
  {
    id: "5",
    sport: "Soccer",
    type: "longshot",
    matchup: "Liverpool vs Chelsea",
    selection: "Both Teams to Score & Over 3.5",
    odds: "+175",
    clawEdge: 7.3,
    anchorTake:
      "Two attacking sides with leaky defenses lately. Anfield always delivers drama. Expect goals.",
    confidence: 55,
    gameTime: "Saturday 12:30 PM ET",
    affiliateLinks: { 
      fanduel: "https://fanduel.com/", 
      betmgm: "https://betmgm.com/" 
    },
  },
  {
    id: "6",
    sport: "Soccer",
    type: "trap",
    matchup: "Tottenham vs Manchester United",
    selection: "FADE: Tottenham -0.5",
    odds: "-120",
    clawEdge: -4.2,
    anchorTake:
      "Public loves Spurs at home but United has been grinding out results. Classic trap game. Stay away or take United +0.5.",
    confidence: 65,
    gameTime: "Sunday 9:00 AM ET",
    affiliateLinks: { 
      fanduel: "https://fanduel.com/", 
      draftkings: "https://draftkings.com/", 
      betmgm: "https://betmgm.com/" 
    },
  },
];

export const MOCK_TICKER: TickerItem[] = [
  { id: "t1", text: "✅ CELTICS -4.5 HIT (+110)", type: "win", timestamp: Date.now() - 3600000 },
  { id: "t2", text: "✅ LAKERS ML HIT (-125)", type: "win", timestamp: Date.now() - 7200000 },
  { id: "t3", text: "🔥 UFC 315: ADESANYA BY KO (+180)", type: "win", timestamp: Date.now() - 86400000 },
  { id: "t4", text: "❌ NUGGETS -6.5 LOSS", type: "loss", timestamp: Date.now() - 90000000 },
  { id: "t5", text: "✅ PARLAY HIT (+450)", type: "win", timestamp: Date.now() - 172800000 },
];

export const MOCK_BRIEFING: DraftClawBriefing = {
  date: new Date().toISOString().split("T")[0],
  confidenceLevel: "HIGH",
  picks: MOCK_PICKS,
  ticker: MOCK_TICKER,
};
