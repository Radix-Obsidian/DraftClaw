import axios from 'axios';
import { logger } from '../utils/logger';

export interface NormalizedOdds {
  sport: string;
  eventId: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  bookmaker: string;
  marketType: string;
  outcomeName: string;
  decimalOdds: number;
  americanOdds: number;
  isSharp: boolean;
}

const SHARP_BOOKS = new Set(['pinnacle', 'circa', 'lowvig', 'betcris']);

export function americanToDecimal(american: number): number {
  if (american > 0) return american / 100 + 1;
  return 100 / Math.abs(american) + 1;
}

function decimalToAmerican(decimal: number): number {
  if (decimal >= 2) return Math.round((decimal - 1) * 100);
  return Math.round(-100 / (decimal - 1));
}

// ============ Provider Adapters ============

interface OddsAdapter {
  name: string;
  getOdds(sport: string): Promise<NormalizedOdds[]>;
}

class TheOddsApiAdapter implements OddsAdapter {
  name = 'TheOddsAPI';
  private apiKey = process.env.ODDS_API_KEY || '';
  private host = process.env.ODDS_API_HOST || 'https://api.the-odds-api.com/v4';

  async getOdds(sport: string): Promise<NormalizedOdds[]> {
    if (!this.apiKey) throw new Error('ODDS_API_KEY not configured');
    const resp = await axios.get(`${this.host}/sports/${sport}/odds`, {
      params: { apiKey: this.apiKey, regions: 'us', markets: 'h2h,spreads,totals', oddsFormat: 'decimal', bookmakers: 'pinnacle,lowvig,fanduel,draftkings,betmgm,caesars' },
      timeout: 10000,
    });
    const out: NormalizedOdds[] = [];
    for (const event of resp.data) {
      for (const bm of event.bookmakers || []) {
        for (const market of bm.markets || []) {
          for (const outcome of market.outcomes || []) {
            const d = outcome.price as number;
            out.push({ sport, eventId: event.id, homeTeam: event.home_team, awayTeam: event.away_team, commenceTime: event.commence_time, bookmaker: bm.key, marketType: market.key, outcomeName: outcome.name, decimalOdds: d, americanOdds: decimalToAmerican(d), isSharp: SHARP_BOOKS.has(bm.key) });
          }
        }
      }
    }
    return out;
  }
}

class SportradarAdapter implements OddsAdapter {
  name = 'Sportradar';
  private endpoints: Record<string, { key: string; path: string }> = {
    basketball_nba: { key: process.env.SPORTRADAR_BASKETBALL_API_KEY || '', path: '/basketball/trial/v8/en/odds/pre-match/events.json' },
    soccer: { key: process.env.SPORTRADAR_SOCCER_API_KEY || '', path: '/soccer-t3/en/schedules/live/results.json' },
    mma: { key: process.env.SPORTRADAR_MMA_API_KEY || '', path: `/mma/trial/v2/en/schedules/${new Date().toISOString().slice(0, 10)}/schedule.json` },
  };

  async getOdds(sport: string): Promise<NormalizedOdds[]> {
    const cfg = this.endpoints[sport];
    if (!cfg?.key) throw new Error(`Sportradar not configured for: ${sport}`);
    const resp = await axios.get(`https://api.sportradar.com${cfg.path}`, { params: { api_key: cfg.key }, timeout: 10000 });
    const events = resp.data?.sport_events || resp.data?.schedules || [];
    const out: NormalizedOdds[] = [];
    for (const ev of events) {
      const se = ev.sport_event || ev;
      const home = se.competitors?.find((c: any) => c.qualifier === 'home')?.name || 'Home';
      const away = se.competitors?.find((c: any) => c.qualifier === 'away')?.name || 'Away';
      for (const market of ev.markets || []) {
        for (const outcome of (market.books?.[0]?.outcomes || [])) {
          const d = outcome.odds ?? 2.0;
          out.push({ sport, eventId: se.id || '', homeTeam: home, awayTeam: away, commenceTime: se.start_time || ev.scheduled || '', bookmaker: 'sportradar', marketType: market.name || 'h2h', outcomeName: outcome.type || outcome.name || '', decimalOdds: d, americanOdds: decimalToAmerican(d), isSharp: false });
        }
      }
    }
    return out;
  }
}

class SportsDataAdapter implements OddsAdapter {
  name = 'SportsData';
  private apiKey = process.env.SPORTSDATA_API_KEY || '';
  private host = process.env.SPORTSDATA_API_HOST || 'https://api.sportsdata.io/v3';

  async getOdds(sport: string): Promise<NormalizedOdds[]> {
    if (!this.apiKey) throw new Error('SPORTSDATA_API_KEY not configured');
    const date = new Date().toISOString().slice(0, 10);
    const resp = await axios.get(`${this.host}/${sport.toLowerCase()}/odds/json/GameOddsLineMovement/${date}`, { params: { key: this.apiKey }, timeout: 10000 });
    const out: NormalizedOdds[] = [];
    for (const game of resp.data || []) {
      for (const line of game.PregameOdds || []) {
        const bk = (line.Sportsbook || 'sportsdata').toLowerCase().replace(/\s+/g, '_');
        const ha = line.HomeMoneyLine || -110, aa = line.AwayMoneyLine || -110;
        out.push({ sport, eventId: String(game.GameId || ''), homeTeam: game.HomeTeam || '', awayTeam: game.AwayTeam || '', commenceTime: game.DateTime || '', bookmaker: bk, marketType: 'h2h', outcomeName: game.HomeTeam || 'home', decimalOdds: americanToDecimal(ha), americanOdds: ha, isSharp: false });
        out.push({ sport, eventId: String(game.GameId || ''), homeTeam: game.HomeTeam || '', awayTeam: game.AwayTeam || '', commenceTime: game.DateTime || '', bookmaker: bk, marketType: 'h2h', outcomeName: game.AwayTeam || 'away', decimalOdds: americanToDecimal(aa), americanOdds: aa, isSharp: false });
      }
    }
    return out;
  }
}

// ============ Unified Service ============

class OddsApiService {
  private adapters: OddsAdapter[] = [new TheOddsApiAdapter(), new SportradarAdapter(), new SportsDataAdapter()];
  updateInterval = parseInt(process.env.ODDS_UPDATE_INTERVAL || '300000', 10);

  async getOdds(sport: string): Promise<NormalizedOdds[]> {
    for (const a of this.adapters) {
      try {
        const data = await a.getOdds(sport);
        if (data.length > 0) return data;
      } catch (err) { logger.warn(`[OddsApiService] ${a.name} failed: ${(err as Error).message}`); }
    }
    return [];
  }

  async getEvents(sport: string) { return this.getOdds(sport); }

  getProviderStatus() { return this.adapters.map((a) => ({ name: a.name })); }
}

export const oddsApiService = new OddsApiService();
