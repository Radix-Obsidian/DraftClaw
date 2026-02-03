import axios from 'axios';
import { logger } from '../utils/logger';

interface SportradarConfig {
  basketball?: {
    apiKey: string;
    host: string;
  };
  soccer?: {
    apiKey: string;
    host: string;
  };
  globalBasketball?: {
    apiKey: string;
    host: string;
  };
  mma?: {
    apiKey: string;
    host: string;
  };
}

export class SportradarApiService {
  private config: SportradarConfig;

  constructor() {
    this.config = {
      basketball: {
        apiKey: process.env.SPORTRADAR_BASKETBALL_API_KEY || '',
        host: process.env.SPORTRADAR_BASKETBALL_HOST || 'https://api.sportradar.com/basketball',
      },
      soccer: {
        apiKey: process.env.SPORTRADAR_SOCCER_API_KEY || '',
        host: process.env.SPORTRADAR_SOCCER_HOST || 'https://api.sportradar.com/soccer',
      },
      globalBasketball: {
        apiKey: process.env.SPORTRADAR_GLOBAL_BASKETBALL_KEY || '',
        host: process.env.SPORTRADAR_GLOBAL_BASKETBALL_HOST || 'https://api.sportradar.com/global-basketball',
      },
      mma: {
        apiKey: process.env.SPORTRADAR_MMA_API_KEY || '',
        host: process.env.SPORTRADAR_MMA_HOST || 'https://api.sportradar.com/mma',
      },
    };
  }

  private getConfigForSport(sport: string) {
    const sportLower = sport.toLowerCase();
    
    if (sportLower === 'ncaab' || sportLower === 'ncaaw' || sportLower === 'wnba') {
      return this.config.globalBasketball || this.config.basketball;
    }
    
    if (sportLower === 'nba' || sportLower === 'basketball') {
      return this.config.basketball;
    }
    
    if (sportLower === 'soccer') {
      return this.config.soccer;
    }
    
    if (sportLower === 'ufc' || sportLower === 'mma') {
      return this.config.mma;
    }
    
    return null;
  }

  async getOdds(sport: string, market: string = 'h2h') {
    const config = this.getConfigForSport(sport);
    
    if (!config || !config.apiKey) {
      throw new Error(`Sportradar not configured for sport: ${sport}`);
    }

    try {
      // Sportradar API structure varies by sport
      const endpoint = this.getEndpointForSport(sport, 'odds');
      
      const response = await axios.get(`${config.host}${endpoint}`, {
        params: {
          api_key: config.apiKey,
        },
        timeout: 10000,
      });

      return this.normalizeOdds(response.data, sport);
    } catch (error) {
      logger.error(`Error fetching Sportradar odds for ${sport}:`, error);
      throw error;
    }
  }

  async getEvents(sport: string) {
    const config = this.getConfigForSport(sport);
    
    if (!config || !config.apiKey) {
      throw new Error(`Sportradar not configured for sport: ${sport}`);
    }

    try {
      const endpoint = this.getEndpointForSport(sport, 'events');
      
      const response = await axios.get(`${config.host}${endpoint}`, {
        params: {
          api_key: config.apiKey,
        },
        timeout: 10000,
      });

      return this.normalizeEvents(response.data, sport);
    } catch (error) {
      logger.error(`Error fetching Sportradar events for ${sport}:`, error);
      throw error;
    }
  }

  async getPlayerNews(sport: string) {
    const config = this.getConfigForSport(sport);
    
    if (!config || !config.apiKey) {
      throw new Error(`Sportradar not configured for sport: ${sport}`);
    }

    try {
      const endpoint = this.getEndpointForSport(sport, 'news');
      
      const response = await axios.get(`${config.host}${endpoint}`, {
        params: {
          api_key: config.apiKey,
        },
        timeout: 10000,
      });

      return response.data;
    } catch (error) {
      logger.error(`Error fetching Sportradar news for ${sport}:`, error);
      throw error;
    }
  }

  private getEndpointForSport(sport: string, dataType: string): string {
    const sportLower = sport.toLowerCase();
    
    // Sportradar API endpoints based on official documentation
    const endpoints: Record<string, Record<string, string>> = {
      nba: {
        odds: '/v8/en/odds/external/odds.json',
        events: '/v8/en/games/2024/REG/schedule.json',
        news: '/v8/en/news/articles.json',
      },
      ncaab: {
        odds: '/v8/en/odds/external/odds.json',
        events: '/v8/en/games/2024/REG/schedule.json',
        news: '/v8/en/news/articles.json',
      },
      ncaaw: {
        odds: '/v8/en/odds/external/odds.json',
        events: '/v8/en/games/2024/REG/schedule.json',
        news: '/v8/en/news/articles.json',
      },
      soccer: {
        odds: '/v4/en/odds/external/odds.json',
        events: '/v4/en/competitions.json',
        news: '/v4/en/news/articles.json',
      },
      ufc: {
        odds: '/v2/en/odds/external/odds.json',
        events: '/v2/en/schedule.json',
        news: '/v2/en/news/articles.json',
      },
    };

    return endpoints[sportLower]?.[dataType] || `/${dataType}`;
  }

  private normalizeOdds(data: any, sport: string) {
    // Normalize Sportradar odds to our internal format
    return Array.isArray(data) ? data : [data];
  }

  private normalizeEvents(data: any, sport: string) {
    // Normalize Sportradar events to our internal format
    return Array.isArray(data) ? data : [data];
  }

  isConfigured(sport: string): boolean {
    const config = this.getConfigForSport(sport);
    return config !== null && !!config?.apiKey;
  }
}

export const sportradarApiService = new SportradarApiService();
