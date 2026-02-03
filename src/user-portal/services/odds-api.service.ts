import axios from 'axios';
import { logger } from '../utils/logger';

interface OddsProvider {
  name: string;
  apiKey: string;
  host: string;
  isAvailable: boolean;
}

class OddsApiService {
  private providers: OddsProvider[];
  private currentProviderIndex: number;
  private updateInterval: number;
  private fallbackStrategy: 'sequential' | 'fastest';

  constructor() {
    this.providers = [
      {
        name: 'TheOddsAPI',
        apiKey: process.env.ODDS_API_KEY || '',
        host: process.env.ODDS_API_HOST || 'https://api.the-odds-api.com/v4',
        isAvailable: true,
      },
      {
        name: 'Sportradar',
        apiKey: process.env.SPORTRADAR_BASKETBALL_API_KEY || '',
        host: process.env.SPORTRADAR_BASKETBALL_HOST || 'https://api.sportradar.com/basketball',
        isAvailable: true,
      },
      {
        name: 'SportsData',
        apiKey: process.env.SPORTSDATA_API_KEY || '',
        host: process.env.SPORTSDATA_API_HOST || 'https://api.sportsdata.io/v3',
        isAvailable: true,
      },
    ];

    this.currentProviderIndex = 0;
    this.updateInterval = parseInt(process.env.ODDS_UPDATE_INTERVAL || '300000', 10);
    this.fallbackStrategy = (process.env.ODDS_FALLBACK_STRATEGY || 'sequential') as 'sequential' | 'fastest';
  }

  private async makeRequest(provider: OddsProvider, endpoint: string, params: any = {}) {
    try {
      const response = await axios.get(`${provider.host}${endpoint}`, {
        params: {
          ...params,
          apiKey: provider.apiKey,
        },
        timeout: 5000, // 5 second timeout
      });
      
      provider.isAvailable = true;
      return response.data;
    } catch (error) {
      provider.isAvailable = false;
      logger.error(`Error fetching from ${provider.name}:`, error);
      throw error;
    }
  }

  private async tryAllProviders(endpoint: string, params: any = {}) {
    if (this.fallbackStrategy === 'fastest') {
      // Try all providers simultaneously and use the fastest response
      const requests = this.providers.map(provider =>
        this.makeRequest(provider, endpoint, params)
          .catch(error => ({ error, provider: provider.name }))
      );

      const responses = await Promise.all(requests);
      const successfulResponse = responses.find(response => !response.error);

      if (successfulResponse) {
        return successfulResponse;
      }
      
      throw new Error('All providers failed to respond');
    } else {
      // Try providers sequentially
      for (let i = 0; i < this.providers.length; i++) {
        const providerIndex = (this.currentProviderIndex + i) % this.providers.length;
        const provider = this.providers[providerIndex];

        try {
          const response = await this.makeRequest(provider, endpoint, params);
          this.currentProviderIndex = providerIndex; // Remember successful provider
          return response;
        } catch (error) {
          continue; // Try next provider
        }
      }

      throw new Error('All providers failed to respond');
    }
  }

  async getOdds(sport: string, market: string = 'h2h') {
    return this.tryAllProviders('/odds', { sport, market });
  }

  async getEvents(sport: string) {
    return this.tryAllProviders('/events', { sport });
  }

  async getHistoricalOdds(eventId: string) {
    return this.tryAllProviders('/historical', { eventId });
  }

  getProviderStatus() {
    return this.providers.map(({ name, isAvailable }) => ({
      name,
      isAvailable,
    }));
  }
}

export const oddsApiService = new OddsApiService();
