import { logger } from '../utils/logger';

const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL || 'http://orchestrator:8100';
const ORCHESTRATOR_API_KEY = process.env.ORCHESTRATOR_API_KEY || '';

export interface ServiceStatus {
  name: string;
  running: boolean;
  lastError?: string;
  lastRun?: Date;
}

class ServiceManager {
  private serviceStatus: Map<string, ServiceStatus> = new Map();
  private timers: NodeJS.Timeout[] = [];

  async startAll(): Promise<void> {
    logger.info('Connecting to LangGraph orchestrator...');

    try {
      const res = await fetch(`${ORCHESTRATOR_URL}/health`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) logger.info(`Orchestrator healthy at ${ORCHESTRATOR_URL}`);
      else logger.warn(`Orchestrator responded with status ${res.status}`);
    } catch {
      logger.warn(`Orchestrator not reachable at ${ORCHESTRATOR_URL} — will retry on schedule`);
    }

    // Odds sync every 5 minutes
    this.schedule('odds-sync', 5 * 60 * 1000, () => this.triggerOrchestrator('trigger/odds'));
    // Pick generation every 30 minutes per sport
    this.schedule('pick-gen-nba', 30 * 60 * 1000, () => this.triggerOrchestrator('trigger/picks/NBA'));
    this.schedule('pick-gen-soccer', 30 * 60 * 1000, () => this.triggerOrchestrator('trigger/picks/Soccer'));
    this.schedule('pick-gen-ufc', 30 * 60 * 1000, () => this.triggerOrchestrator('trigger/picks/UFC'));

    logger.info('Background service schedules registered');
  }

  private schedule(name: string, intervalMs: number, fn: () => Promise<void>): void {
    this.serviceStatus.set(name, { name, running: true });
    setTimeout(async () => {
      await fn().catch((e) => logger.error(`[${name}] initial error:`, e));
      const timer = setInterval(async () => {
        await fn().catch((e) => logger.error(`[${name}] error:`, e));
        this.serviceStatus.set(name, { ...this.serviceStatus.get(name)!, lastRun: new Date() });
      }, intervalMs);
      this.timers.push(timer);
    }, 10_000);
  }

  async stopAll(): Promise<void> {
    for (const timer of this.timers) { clearInterval(timer); clearTimeout(timer); }
    this.timers = [];
    logger.info('All service schedules cleared');
  }

  getStatus(): ServiceStatus[] {
    return Array.from(this.serviceStatus.values());
  }

  async restartService(serviceName: string): Promise<void> {
    logger.info(`Restart '${serviceName}' — triggering orchestrator`);
    if (serviceName.includes('odds')) await this.triggerOrchestrator('trigger/odds');
    else if (serviceName.includes('pick')) await this.triggerOrchestrator('trigger/picks/NBA');
    else if (serviceName.includes('result')) await this.triggerOrchestrator('trigger/results');
  }

  async triggerPickGeneration(sport = 'NBA'): Promise<number> {
    await this.triggerOrchestrator(`trigger/picks/${sport}`);
    return 0;
  }

  private async triggerOrchestrator(path: string): Promise<void> {
    try {
      const res = await fetch(`${ORCHESTRATOR_URL}/${path}`, {
        method: 'POST',
        headers: { 'X-Orchestrator-Key': ORCHESTRATOR_API_KEY, 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10_000),
      });
      if (res.ok) {
        const body = await res.json() as { status: string; thread_id: string };
        logger.info(`[orchestrator] ${path} → ${body.status} (thread: ${body.thread_id})`);
      } else {
        logger.warn(`[orchestrator] ${path} responded with ${res.status}`);
      }
    } catch (err) {
      logger.error(`[orchestrator] failed to trigger ${path}:`, err);
    }
  }
}

export const serviceManager = new ServiceManager();

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down...');
  await serviceManager.stopAll();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down...');
  await serviceManager.stopAll();
  process.exit(0);
});
