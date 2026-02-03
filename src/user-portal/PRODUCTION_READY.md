# Production Readiness Status

## ✅ Completed - Development Phase

### Real-Time AI System
- ✅ AI Pick Generator Service implemented
- ✅ Background services (odds sync, news feed) integrated
- ✅ Mock data completely disabled
- ✅ Database migration for pick expiration completed
- ✅ Admin monitoring endpoints added
- ✅ Service health monitoring implemented
- ✅ Graceful shutdown handlers configured

### Configuration
- ✅ TypeScript configuration fixed (tsconfig.json created)
- ✅ Migration runner created (no psql dependency)
- ✅ Environment variables documented
- ✅ Logger utility implemented

---

## 🔧 Next Steps - Before Production

### 1. Test Everything Works (Development)

**Run the server:**
```bash
cd src/user-portal
npm install
npm start
```

**Verify services started:**
- Check console for: "✅ Background services started"
- Check console for: "🤖 AI Pick Generation: Active"

**Test endpoints:**
```bash
# Health check
curl http://localhost:3001/health

# Check if picks are being generated (wait 30 seconds after startup)
curl http://localhost:3001/api/picks

# Check news feed
curl http://localhost:3001/api/news
```

**Monitor logs:**
- Watch for "Starting AI pick generation..."
- Watch for "Pick generation complete: X generated"
- Check for any errors

### 2. Once Development Testing Passes

**Create `.env.production` file:**
```bash
cp .env .env.production
```

**Update `.env.production` with production values:**

```bash
# CRITICAL CHANGES FOR PRODUCTION
NODE_ENV=production

# Generate NEW JWT secret (NEVER use dev secret in prod)
# Run: node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
DRAFTCLAW_JWT_SECRET=<NEW_SECRET_HERE>

# Production URLs
DRAFTCLAW_PORTAL_URL=https://api.draftclaw.ai
DRAFTCLAW_PORTAL_ORIGIN=https://draftclaw.ai

# Production Database
DATABASE_URL=postgresql://prod_user:prod_pass@prod-host:5432/draftclaw_prod
SUPABASE_URL=https://your-prod-project.supabase.co
SUPABASE_ANON_KEY=<PROD_KEY>
SUPABASE_SERVICE_ROLE_KEY=<PROD_KEY>

# Production Stripe (LIVE keys)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Production CORS (specific domains only)
CORS_ALLOWED_ORIGINS=https://draftclaw.ai,https://www.draftclaw.ai

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
LOG_LEVEL=warn
DEBUG=false
```

### 3. Production Deployment Steps

1. **Set up production database**
   - Create production Supabase project OR PostgreSQL instance
   - Run all migrations on production DB:
     ```bash
     # Set DATABASE_URL to production
     export DATABASE_URL=<prod_url>
     
     node src/user-portal/db/run-migration.mjs 001_initial_schema.sql
     node src/user-portal/db/run-migration.mjs 002_sports_data_schema.sql
     node src/user-portal/db/run-migration.mjs 003_news_and_optimization.sql
     node src/user-portal/db/run-migration.mjs 004_pick_expiration_cleanup.sql
     node src/user-portal/db/run-migration.mjs security-policies.sql
     ```

2. **Configure production Stripe**
   - Switch to live mode in Stripe dashboard
   - Create production price IDs
   - Update webhook endpoints
   - Test checkout flow in Stripe test mode first

3. **Verify API keys are production-ready**
   - The Odds API: Check rate limits for production tier
   - Sportradar: Verify subscription supports production load
   - SportsData.io: Check quota limits

4. **Deploy to hosting platform**
   - Choose platform: AWS, Heroku, Railway, Render, etc.
   - Set environment variables from `.env.production`
   - Configure auto-scaling if needed
   - Set up health checks

5. **Post-deployment verification**
   ```bash
   # Health check
   curl https://api.draftclaw.ai/health
   
   # Service status (requires admin auth)
   curl -H "Authorization: Bearer <admin_token>" \
     https://api.draftclaw.ai/api/admin/services/status
   
   # Check picks are being generated
   curl https://api.draftclaw.ai/api/picks
   ```

6. **Set up monitoring**
   - Configure Sentry for error tracking
   - Set up uptime monitoring (Pingdom, UptimeRobot)
   - Create alerts for service failures
   - Monitor API rate limits

---

## 📋 Production Checklist

Use this checklist before going live:

- [ ] Development testing complete (all services working)
- [ ] `.env.production` created with all production values
- [ ] NEW JWT secret generated (never reuse dev secret)
- [ ] Production database set up and migrations run
- [ ] Production Stripe configured (live keys, webhooks)
- [ ] Production API keys verified (rate limits checked)
- [ ] CORS configured for production domains only
- [ ] Monitoring/alerting configured (Sentry, uptime)
- [ ] Backup strategy implemented
- [ ] Rollback plan documented
- [ ] Team notified of deployment window

---

## 🚨 Security Reminders

**NEVER commit to git:**
- `.env` file
- `.env.production` file
- Any file containing API keys or secrets

**ALWAYS:**
- Use different secrets for dev vs production
- Rotate secrets regularly
- Use HTTPS only in production
- Enable rate limiting
- Review CORS settings
- Keep dependencies updated

---

## 📊 Monitoring After Launch

**First 24 hours:**
- Monitor error rates closely
- Check API usage vs rate limits
- Verify picks are generating correctly
- Watch database performance
- Monitor response times

**Ongoing:**
- Review logs daily
- Check pick accuracy weekly
- Monitor API costs
- Review user feedback
- Update AI algorithm based on results

---

## 🐛 Common Issues & Solutions

### Issue: Services not starting
**Solution**: Check DATABASE_URL and API keys are set correctly

### Issue: No picks being generated
**Solution**: 
1. Check odds data exists: `SELECT COUNT(*) FROM odds_snapshots`
2. Check events exist: `SELECT COUNT(*) FROM events WHERE status='scheduled'`
3. Manually trigger: `POST /api/admin/picks/generate`

### Issue: API rate limits exceeded
**Solution**: Increase sync intervals in environment variables

### Issue: Database connection errors
**Solution**: Check connection pool settings, verify DATABASE_URL

---

## 📞 Support

- **Documentation**: See `PRODUCTION_CHECKLIST.md` for full details
- **Services Guide**: See `services/README.md`
- **Implementation**: See `IMPLEMENTATION_SUMMARY.md`

---

**Current Status**: ✅ Ready for development testing  
**Next Milestone**: Production deployment after successful dev testing  
**Last Updated**: February 2, 2026
