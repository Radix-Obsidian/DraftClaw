import axios from 'axios';
import { logger } from '../utils/logger';

interface SportsDataMetadata {
  currentTime: string;
  packageName: string;
  recordingStartTime: string;
  recordingEndTime: string;
}

export class SportsDataApiService {
  private apiKey: string;
  private apiHost: string;
  private replayApiHost: string;
  private isReplayMode: boolean;
  private metadata?: SportsDataMetadata;

  constructor() {
    this.apiKey = process.env.SPORTSDATA_API_KEY || '';
    this.apiHost = process.env.SPORTSDATA_API_HOST || 'https://api.sportsdata.io/v3';
    this.replayApiHost = process.env.SPORTSDATA_REPLAY_API_HOST || 'https://replay.sportsdata.io/api/v3';
    this.isReplayMode = process.env.NODE_ENV === 'development';
  }

  private getBaseUrl(): string {
    return this.isReplayMode ? this.replayApiHost : this.apiHost;
  }

  async initializeReplay() {
    if (!this.isReplayMode) return;

    try {
      const response = await axios.get(`${this.replayApiHost}/metadata`, {
        params: { key: this.apiKey }
      });
      this.metadata = response.data;
      logger.info('SportsData.io replay metadata loaded:', this.metadata);
    } catch (error) {
      logger.error('Failed to initialize SportsData.io replay:', error);
      throw error;
    }
  }

  async getOdds(sport: string, market: string = 'gameLines') {
    const baseUrl = this.getBaseUrl();
    const endpoint = `/${sport}/odds/json/${market}`;

    try {
      const response = await axios.get(`${baseUrl}${endpoint}`, {
        params: {
          key: this.apiKey
        }
      });

      return response.data;
    } catch (error) {
      logger.error(`Error fetching odds from SportsData.io for ${sport}:`, error);
      throw error;
    }
  }

  async getPlayByPlay(sport: string, season: string, week: string) {
    const baseUrl = this.getBaseUrl();
    const endpoint = `/${sport}/pbp/json/playbyplaydelta/${season}/${week}/all`;

    try {
      const response = await axios.get(`${baseUrl}${endpoint}`, {
        params: {
          key: this.apiKey
        }
      });

      return response.data;
    } catch (error) {
      logger.error(`Error fetching play by play from SportsData.io:`, error);
      throw error;
    }
  }

  async getSimulationData(sport: string, packageName: string) {
    if (!this.isReplayMode) {
      throw new Error('Simulation data is only available in replay mode');
    }

    try {
      const response = await axios.get(`${this.replayApiHost}/${sport}/simulation/json/${packageName}`, {
        params: {
          key: this.apiKey
        }
      });

      return response.data;
    } catch (error) {
      logger.error(`Error fetching simulation data from SportsData.io:`, error);
      throw error;
    }
  }

  getReplayMetadata(): SportsDataMetadata | undefined {
    return this.metadata;
  }

  setReplayMode(enabled: boolean) {
    this.isReplayMode = enabled;
  }
}
