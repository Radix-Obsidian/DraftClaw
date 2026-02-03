import type { DraftClawConfig } from "./types.js";

const DEEP_LINK_TEMPLATES: Record<string, string> = {
  fanduel: "https://sportsbook.fanduel.com/navigation/nba?btag={affiliate}&event={eventId}&market={marketKey}",
  draftkings: "https://sportsbook.draftkings.com/leagues/basketball/nba?affiliate={affiliate}&eventId={eventId}&market={marketKey}",
  betmgm: "https://sports.betmgm.com/en/sports/basketball-7/betting/usa-9/nba-6?event={eventId}&market={marketKey}",
};

const BOOKMAKER_DISPLAY_NAMES: Record<string, string> = {
  fanduel: "FanDuel",
  draftkings: "DraftKings",
  betmgm: "BetMGM",
  pinnacle: "Pinnacle",
  lowvig: "LowVig",
};

export function generateAffiliateLink(
  bookmaker: string,
  marketKey: string,
  eventId: string,
  config: DraftClawConfig
): string {
  const template = DEEP_LINK_TEMPLATES[bookmaker];
  if (!template) {
    return `https://www.google.com/search?q=${encodeURIComponent(bookmaker + " sportsbook")}`;
  }

  const affiliateId = config.affiliates[bookmaker as keyof typeof config.affiliates] ?? "draftclaw";

  return template
    .replace("{affiliate}", encodeURIComponent(affiliateId))
    .replace("{eventId}", encodeURIComponent(eventId))
    .replace("{marketKey}", encodeURIComponent(marketKey));
}

export function getBookmakerDisplayName(key: string): string {
  return BOOKMAKER_DISPLAY_NAMES[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}

export function isSharpBook(bookmakerKey: string): boolean {
  return ["pinnacle", "lowvig", "betcris", "circa"].includes(bookmakerKey.toLowerCase());
}

export function isSoftBook(bookmakerKey: string): boolean {
  return ["fanduel", "draftkings", "betmgm", "pointsbet", "caesars"].includes(bookmakerKey.toLowerCase());
}
