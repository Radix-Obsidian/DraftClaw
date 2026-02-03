import { oddsSyncService } from './odds-sync.service';
import { newsFeedService } from './news-feed.service';
import { aiPickGeneratorService } from './ai-pick-generator.service';
import { logger } from '../utils/logger';

export interface ServiceStatus {
  name: string;
  running: boolean;
  lastError?: string;
  lastRun?: Date;
}

class ServiceManager {
  private services: Map<string, any>;
  private serviceStatus: Map<string, ServiceStatus>;

  constructor() {
    this.services = new Map();
    this.serviceStatus = new Map();
  }

  async startAll(): Promise<void> {
    logger.info('Starting all background services...');

    try {
      // Start odds sync service
      await this.startService('odds-sync', oddsSyncService);

      // Start news feed service
      await this.startService('news-feed', newsFeedService);

      // Start AI pick generator (with delay to let data sync first)
      setTimeout(async () => {
        await this.startService('ai-pick-generator', aiPickGeneratorService);
      }, 30000);

      logger.info('All background services started successfully');
    } catch (error) {
      logger.error('Error starting services:', error);
      throw error;
    }
  }

  private async startService(name: string, service: any): Promise<void> {
    try {
      this.services.set(name, service);
      this.serviceStatus.set(name, {
        name,
        running: false,
      });

      await service.start();

      this.serviceStatus.set(name, {
        name,
        running: true,
        lastRun: new Date(),
      });

      logger.info(`Service '${name}' started successfully`);
    } catch (error) {
      logger.error(`Failed to start service '${name}':`, error);
      this.serviceStatus.set(name, {
        name,
        running: false,
        lastError: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async stopAll(): Promise<void> {
    logger.info('Stopping all background services...');

    for (const [name, service] of this.services.entries()) {
      try {
        if (service.stop) {
          await service.stop();
          this.serviceStatus.set(name, {
            name,
            running: false,
          });
          logger.info(`Service '${name}' stopped`);
        }
      } catch (error) {
        logger.error(`Error stopping service '${name}':`, error);
      }
    }

    logger.info('All background services stopped');
  }

  getStatus(): ServiceStatus[] {
    return Array.from(this.serviceStatus.values());
  }

  async restartService(serviceName: string): Promise<void> {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service '${serviceName}' not found`);
    }

    logger.info(`Restarting service '${serviceName}'...`);

    if (service.stop) {
      await service.stop();
    }

    await this.startService(serviceName, service);
  }

  async triggerPickGeneration(): Promise<number> {
    const service = this.services.get('ai-pick-generator');
    if (!service) {
      throw new Error('AI Pick Generator service not found');
    }

    logger.info('Manually triggering pick generation...');
    return await aiPickGeneratorService.generatePicksOnDemand();
  }
}

export const serviceManager = new ServiceManager();

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await serviceManager.stopAll();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await serviceManager.stopAll();
  process.exit(0);
});
