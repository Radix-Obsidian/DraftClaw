# DraftClaw Background Services

This directory contains the background services that power DraftClaw's real-time sports data analysis and AI pick generation.

## Services

### 1. Odds Sync Service (`odds-sync.service.ts`)
Fetches live odds from multiple sportsbooks and stores them in the database.

- **Interval**: Every 5 minutes (configurable via `ODDS_UPDATE_INTERVAL`)
- **Data Sources**: TheOddsAPI, Sportradar, SportsData.io
- **Functionality**:
  - Fetches upcoming events for NBA, UFC, Soccer
  - Stores odds snapshots with timestamps
  - Tracks sharp vs retail line movements

### 2. News Feed Service (`news-feed.service.ts`)
Syncs sports news articles and player updates from external APIs.

- **Interval**: Every 15 minutes (configurable via `NEWS_UPDATE_INTERVAL`)
- **Data Sources**: SportsData.io, RotoBallerArticles
- **Functionality**:
  - Fetches latest news articles
  - Processes player injury reports
  - Generates SEO-optimized content
  - Performs basic sentiment analysis

### 3. AI Pick Generator Service (`ai-pick-generator.service.ts`)
Analyzes live odds and news to generate AI-powered betting picks.

- **Interval**: Every 30 minutes (configurable via `PICK_GENERATION_INTERVAL`)
- **Functionality**:
  - Analyzes sharp vs retail line movements
  - Calculates edge percentages and expected value
  - Factors in recent news sentiment
  - Generates picks with confidence scores (40-95%)
  - Auto-expires picks 1 hour before game time
  - Deactivates picks for started/completed events

**Pick Types**:
- **Lock** (75%+ confidence): High-confidence plays
- **Longshot** (55-74% confidence): Value plays with solid edge
- **Trap** (<55% confidence): Warning picks to fade public money

### 4. Service Manager (`service-manager.ts`)
Coordinates all background services with health monitoring and graceful shutdown.

- **Functionality**:
  - Starts all services in proper order
  - Monitors service health and status
  - Handles graceful shutdown on SIGTERM/SIGINT
  - Provides restart capabilities
  - Exposes status API for monitoring

## Configuration

### Environment Variables

```bash
# Odds Sync
ODDS_UPDATE_INTERVAL=300000          # 5 minutes in ms
ODDS_API_KEY=your_odds_api_key
ODDS_API_HOST=https://api.the-odds-api.com/v4

# News Feed
NEWS_UPDATE_INTERVAL=900000          # 15 minutes in ms
SPORTSDATA_API_KEY=your_sportsdata_key
SPORTSDATA_API_HOST=https://api.sportsdata.io/v3

# AI Pick Generator
PICK_GENERATION_INTERVAL=1800000     # 30 minutes in ms

# Database
DATABASE_URL=postgresql://user:pass@host:5432/draftclaw
```

## Usage

### Automatic Startup

Services start automatically when the user portal server starts:

```typescript
import { startUserPortalServer } from './index.js';

await startUserPortalServer();
// All background services are now running
```

### Manual Control

```typescript
import { serviceManager } from './services/service-manager.js';

// Start all services
await serviceManager.startAll();

// Stop all services
await serviceManager.stopAll();

// Restart a specific service
await serviceManager.restartService('ai-pick-generator');

// Trigger pick generation on-demand
const picksGenerated = await serviceManager.triggerPickGeneration();
```

### Admin API Endpoints

**Get Service Status**
```bash
GET /api/admin/services/status
Authorization: Bearer <admin_token>
```

**Restart Service**
```bash
POST /api/admin/services/:serviceName/restart
Authorization: Bearer <admin_token>
```

**Trigger Pick Generation**
```bash
POST /api/admin/picks/generate
Authorization: Bearer <admin_token>
```

## AI Pick Generation Algorithm

### 1. Odds Analysis
- Compare sharp lines (Pinnacle, Circa) vs retail books
- Calculate edge: `|retailLine - sharpLine| / 10`
- Find best available odds across all books

### 2. News Impact
- Fetch recent news mentioning teams/players
- Perform sentiment analysis (positive/negative/neutral)
- Calculate impact score based on keyword frequency

### 3. Confidence Calculation
```
baseConfidence = min(edge * 5, 85)
confidence = baseConfidence + (newsImpact / 2)  // if positive
confidence = baseConfidence - (newsImpact / 2)  // if negative
confidence = clamp(confidence, 30, 95)
```

### 4. Pick Classification
- **Lock**: confidence >= 75%
- **Longshot**: confidence 55-74%
- **Trap**: confidence < 55%

### 5. Expected Value
```
impliedProbability = oddsToImpliedProbability(americanOdds)
expectedValue = ((confidence / 100) - impliedProbability) * 100
```

### 6. Unit Sizing
- 3 units: confidence >= 75%
- 2 units: confidence >= 60%
- 1 unit: confidence < 60%

## Data Freshness

### Automatic Cleanup
- **Picks**: Deactivated 1 hour before game time or when event starts
- **Odds**: Keep last 24 hours, clean older snapshots daily
- **News**: Keep last 7 days of articles
- **Events**: Archive completed events after 48 hours

### Database Functions
```sql
-- Deactivate expired picks
SELECT deactivate_expired_picks();

-- Clean old picks (default 30 days)
SELECT cleanup_old_picks(30);

-- Clean old odds (default 7 days)
SELECT cleanup_old_odds_snapshots(7);
```

## Monitoring

### Service Health Checks
Each service tracks:
- Running status (true/false)
- Last run timestamp
- Last error message (if any)

### Logging
All services use structured logging:
```
[timestamp] [LEVEL] [UserPortal] message
```

Levels: INFO, WARN, ERROR, DEBUG

## Troubleshooting

### Services Not Starting
1. Check database connection: `DATABASE_URL` is set
2. Verify API keys are configured
3. Check logs for specific error messages

### No Picks Being Generated
1. Verify odds data exists: `SELECT COUNT(*) FROM odds_snapshots WHERE fetched_at > NOW() - INTERVAL '1 hour'`
2. Check upcoming events: `SELECT COUNT(*) FROM events WHERE status = 'scheduled' AND commence_time > NOW()`
3. Manually trigger: `POST /api/admin/picks/generate`

### Stale Data
1. Check service status: `GET /api/admin/services/status`
2. Restart services: `POST /api/admin/services/:serviceName/restart`
3. Verify API rate limits haven't been exceeded

## Development

### Running Tests
```bash
npm test src/user-portal/services/
```

### Manual Testing
```bash
# Test AI pick generation
node src/user-portal/test-ai-data-processing.mjs

# Verify data pipeline
node src/user-portal/verify-data-pipeline.mjs
```

## Production Considerations

1. **Rate Limiting**: Monitor API usage to avoid hitting rate limits
2. **Error Handling**: Services continue running even if individual syncs fail
3. **Database Load**: Indexes are optimized for frequent queries
4. **Memory Usage**: Services clean up connections properly
5. **Graceful Shutdown**: SIGTERM/SIGINT handlers ensure clean shutdown
