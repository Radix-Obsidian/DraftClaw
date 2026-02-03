import { Gauge, Counter, register } from 'prom-client';
import { Express } from 'express';
import { createLogger, format, transports } from 'winston';
import * as Sentry from "@sentry/node";
import { ProfilingIntegration } from "@sentry/profiling-node";

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    new ProfilingIntegration(),
  ],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
});

// Create Winston logger
export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'combined.log' })
  ]
});

// Prometheus metrics
const apiLatencyHistogram = new Gauge({
  name: 'api_request_duration_seconds',
  help: 'API request latency in seconds',
  labelNames: ['method', 'route', 'status_code']
});

const activeUsersGauge = new Gauge({
  name: 'active_users',
  help: 'Number of currently active users'
});

const apiErrorCounter = new Counter({
  name: 'api_errors_total',
  help: 'Total count of API errors',
  labelNames: ['method', 'route', 'error_type']
});

const dataRefreshGauge = new Gauge({
  name: 'last_data_refresh_timestamp',
  help: 'Timestamp of last sports data refresh'
});

const marketAnalysisGauge = new Gauge({
  name: 'market_analysis_duration_seconds',
  help: 'Duration of market analysis calculations'
});

// Monitoring middleware
export const monitoringMiddleware = (app: Express) => {
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
  });

  // Readiness check endpoint
  app.get('/ready', async (req, res) => {
    try {
      // Add your readiness checks here
      const checks = await Promise.all([
        checkDatabase(),
        checkSportsDataAPI(),
        checkCache()
      ]);

      const allReady = checks.every(check => check.status === 'ready');
      res.status(allReady ? 200 : 503).json({
        status: allReady ? 'ready' : 'not_ready',
        checks
      });
    } catch (error) {
      res.status(500).json({ status: 'error', error: error.message });
    }
  });

  // Metrics endpoint for Prometheus
  app.get('/metrics', async (req, res) => {
    try {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    } catch (error) {
      res.status(500).end(error);
    }
  });

  // Request tracking middleware
  app.use((req, res, next) => {
    const start = Date.now();

    // Track response
    res.on('finish', () => {
      const duration = Date.now() - start;
      apiLatencyHistogram.labels(req.method, req.path, res.statusCode.toString()).set(duration / 1000);
      
      // Log errors
      if (res.statusCode >= 400) {
        apiErrorCounter.labels(req.method, req.path, res.statusCode.toString()).inc();
        logger.error('API Error', {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          error: res.locals.error
        });

        // Report to Sentry if it's a server error
        if (res.statusCode >= 500) {
          Sentry.captureException(res.locals.error || new Error('Server Error'));
        }
      }
    });

    next();
  });
};

// Market analysis monitoring
export const monitorMarketAnalysis = async (analysisFunc: Function) => {
  const start = Date.now();
  try {
    const result = await analysisFunc();
    const duration = (Date.now() - start) / 1000;
    marketAnalysisGauge.set(duration);
    return result;
  } catch (error) {
    logger.error('Market analysis error', { error });
    Sentry.captureException(error);
    throw error;
  }
};

// Data refresh monitoring
export const monitorDataRefresh = (timestamp: number) => {
  dataRefreshGauge.set(timestamp);
};

// Active users monitoring
export const updateActiveUsers = (count: number) => {
  activeUsersGauge.set(count);
};

// Health check functions
async function checkDatabase() {
  try {
    // Add your database health check here
    return { component: 'database', status: 'ready' };
  } catch (error) {
    return { component: 'database', status: 'error', error: error.message };
  }
}

async function checkSportsDataAPI() {
  try {
    // Add your sports data API health check here
    return { component: 'sports_data_api', status: 'ready' };
  } catch (error) {
    return { component: 'sports_data_api', status: 'error', error: error.message };
  }
}

async function checkCache() {
  try {
    // Add your cache health check here
    return { component: 'cache', status: 'ready' };
  } catch (error) {
    return { component: 'cache', status: 'error', error: error.message };
  }
}
