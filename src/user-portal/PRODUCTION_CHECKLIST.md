# Production Configuration Checklist

## ⚠️ Pre-Production Requirements

Before deploying to production, complete ALL items in this checklist.

---

## 1. Environment Configuration

### `.env` File Updates

- [ ] **Set NODE_ENV to production**
  ```bash
  NODE_ENV=production
  ```

- [ ] **Update URLs to production domains**
  ```bash
  DRAFTCLAW_PORTAL_URL=https://api.draftclaw.ai
  DRAFTCLAW_PORTAL_ORIGIN=https://draftclaw.ai
  ```

- [ ] **Generate new JWT secret** (CRITICAL - never use dev secret in prod)
  ```bash
  # Run this command and paste output:
  node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
  ```

- [ ] **Configure production database**
  ```bash
  DATABASE_URL=postgresql://user:pass@prod-host:5432/draftclaw_prod
  ```

- [ ] **Add production Stripe keys**
  ```bash
  STRIPE_SECRET_KEY=sk_live_...
  STRIPE_PUBLISHABLE_KEY=pk_live_...
  STRIPE_WEBHOOK_SECRET=whsec_...
  ```

- [ ] **Set production CORS origins**
  ```bash
  CORS_ALLOWED_ORIGINS=https://draftclaw.ai,https://www.draftclaw.ai
  ```

- [ ] **Configure monitoring**
  ```bash
  SENTRY_DSN=https://your-sentry-dsn
  LOG_LEVEL=warn  # or 'error' for production
  DEBUG=false
  ```

---

## 2. Security Hardening

- [ ] **Remove all test/development API keys**
- [ ] **Rotate all secrets and tokens**
- [ ] **Enable rate limiting** (already configured, verify limits)
- [ ] **Review CORS settings** (whitelist specific domains only)
- [ ] **Enable HTTPS only** (no HTTP in production)
- [ ] **Set secure cookie flags** (httpOnly, secure, sameSite)
- [ ] **Review admin authentication** (ensure proper role checks)

---

## 3. Database

- [ ] **Run all migrations**
  ```bash
  node src/user-portal/db/run-migration.mjs 001_initial_schema.sql
  node src/user-portal/db/run-migration.mjs 002_sports_data_schema.sql
  node src/user-portal/db/run-migration.mjs 003_news_and_optimization.sql
  node src/user-portal/db/run-migration.mjs 004_pick_expiration_cleanup.sql
  ```

- [ ] **Enable Row Level Security (RLS)**
  ```bash
  node src/user-portal/db/run-migration.mjs security-policies.sql
  ```

- [ ] **Set up automated backups** (daily at minimum)
- [ ] **Configure connection pooling** (verify pool size for load)
- [ ] **Set up database monitoring** (query performance, slow queries)

---

## 4. API Keys & External Services

- [ ] **Verify all API keys are production-ready**
  - [ ] The Odds API (check rate limits)
  - [ ] Sportradar (verify subscription tier)
  - [ ] SportsData.io (check quota)

- [ ] **Test API connectivity**
  ```bash
  node src/user-portal/test-ai-data-processing.mjs
  ```

- [ ] **Configure API rate limit handling**
- [ ] **Set up API usage monitoring**

---

## 5. Background Services

- [ ] **Verify service intervals are appropriate for production**
  ```bash
  ODDS_UPDATE_INTERVAL=300000      # 5 min - adjust based on API limits
  NEWS_UPDATE_INTERVAL=900000      # 15 min
  PICK_GENERATION_INTERVAL=1800000 # 30 min
  ```

- [ ] **Test service startup and shutdown**
- [ ] **Configure service monitoring/alerting**
- [ ] **Set up health check endpoints**
- [ ] **Test graceful shutdown (SIGTERM handling)**

---

## 6. Performance Optimization

- [ ] **Enable production mode for all frameworks**
- [ ] **Configure caching headers** (already set, verify)
- [ ] **Set up CDN for static assets** (if applicable)
- [ ] **Enable gzip/brotli compression**
- [ ] **Review database indexes** (already optimized)
- [ ] **Set up connection pooling** (verify max connections)

---

## 7. Monitoring & Logging

- [ ] **Set up error tracking** (Sentry or similar)
- [ ] **Configure log aggregation** (CloudWatch, Datadog, etc.)
- [ ] **Set up uptime monitoring** (Pingdom, UptimeRobot, etc.)
- [ ] **Create alerting rules**
  - Service failures
  - API rate limit warnings
  - Database connection issues
  - High error rates

- [ ] **Set up performance monitoring**
  - Response times
  - Database query performance
  - API latency

---

## 8. Deployment

- [ ] **Choose deployment platform**
  - [ ] AWS (EC2, ECS, Lambda)
  - [ ] Heroku
  - [ ] DigitalOcean
  - [ ] Railway
  - [ ] Render
  - [ ] Other: ___________

- [ ] **Configure CI/CD pipeline**
- [ ] **Set up staging environment** (test before prod)
- [ ] **Configure auto-scaling** (if applicable)
- [ ] **Set up load balancing** (if needed)

---

## 9. Testing

- [ ] **Run all unit tests**
  ```bash
  npm test
  ```

- [ ] **Test authentication flow**
  - Registration
  - Login
  - Password reset
  - Token refresh

- [ ] **Test subscription flow**
  - Checkout
  - Webhook handling
  - Cancellation
  - Reactivation

- [ ] **Test background services**
  - Odds sync
  - News feed
  - AI pick generation

- [ ] **Load testing** (simulate production traffic)
- [ ] **Security testing** (penetration testing)

---

## 10. Documentation

- [ ] **Update README with production setup**
- [ ] **Document deployment process**
- [ ] **Create runbook for common issues**
- [ ] **Document monitoring/alerting setup**
- [ ] **Create incident response plan**

---

## 11. Legal & Compliance

- [ ] **Privacy Policy updated**
- [ ] **Terms of Service updated**
- [ ] **GDPR compliance verified** (if applicable)
- [ ] **Data retention policies implemented**
- [ ] **Cookie consent configured** (if applicable)

---

## 12. Final Checks

- [ ] **Remove all seed/mock data** ✅ (already done)
- [ ] **Verify no console.log in production code**
- [ ] **Remove development dependencies from production build**
- [ ] **Test rollback procedure**
- [ ] **Create backup of current production** (if updating)
- [ ] **Notify team of deployment window**

---

## Quick Production .env Template

```bash
# PRODUCTION ENVIRONMENT - DO NOT COMMIT THIS FILE

# Server
NODE_ENV=production
DRAFTCLAW_PORTAL_PORT=3001
DRAFTCLAW_PORTAL_URL=https://api.draftclaw.ai
DRAFTCLAW_PORTAL_ORIGIN=https://draftclaw.ai

# JWT (GENERATE NEW SECRET!)
DRAFTCLAW_JWT_SECRET=<GENERATE_NEW_64_BYTE_BASE64_SECRET>
JWT_ACCESS_TOKEN_EXPIRY=900
JWT_REFRESH_TOKEN_EXPIRY=604800

# Database (PRODUCTION)
DATABASE_URL=postgresql://prod_user:prod_pass@prod-host:5432/draftclaw_prod

# Supabase (PRODUCTION)
SUPABASE_URL=https://your-prod-project.supabase.co
SUPABASE_ANON_KEY=<PROD_ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<PROD_SERVICE_ROLE_KEY>

# Stripe (LIVE KEYS)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...
STRIPE_PRICE_GOAT_MONTHLY=price_...
STRIPE_PRICE_GOAT_YEARLY=price_...

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ALLOWED_ORIGINS=https://draftclaw.ai,https://www.draftclaw.ai

# Sports APIs (PRODUCTION KEYS)
ODDS_API_KEY=<PROD_KEY>
SPORTRADAR_BASKETBALL_API_KEY=<PROD_KEY>
SPORTSDATA_API_KEY=<PROD_KEY>

# Background Services
ODDS_UPDATE_INTERVAL=300000
NEWS_UPDATE_INTERVAL=900000
PICK_GENERATION_INTERVAL=1800000
ODDS_FALLBACK_STRATEGY=sequential

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
LOG_LEVEL=warn
DEBUG=false
```

---

## Post-Deployment Verification

After deploying to production:

1. **Verify services are running**
   ```bash
   curl https://api.draftclaw.ai/health
   curl https://api.draftclaw.ai/api/admin/services/status
   ```

2. **Check logs for errors**
3. **Monitor API usage and rate limits**
4. **Verify picks are being generated**
5. **Test user registration and login**
6. **Test subscription checkout flow**
7. **Monitor database performance**
8. **Check error tracking dashboard**

---

## Rollback Plan

If issues occur in production:

1. **Immediate**: Switch traffic back to previous version
2. **Database**: Restore from latest backup if needed
3. **Services**: Stop background services if causing issues
4. **Investigate**: Review logs and error tracking
5. **Fix**: Address issues in staging first
6. **Redeploy**: Only after thorough testing

---

## Support Contacts

- **Database Issues**: [DBA contact]
- **API Issues**: [API provider support]
- **Deployment Issues**: [DevOps contact]
- **Security Issues**: [Security team]

---

**Last Updated**: February 2, 2026  
**Next Review**: Before production deployment
