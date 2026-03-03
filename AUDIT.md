# DraftClaw Production Functionality Audit

**Date:** 2026-03-02
**Auditor:** Claude (claude-sonnet-4-6)
**Branch:** `claude/init-project-setup-UbLpB`
**Scope:** Full static source audit — no live API calls or runtime execution performed

---

## Executive Summary

DraftClaw is a TypeScript ESM monorepo (v1.0.0-beta.1) comprising two distinct layers:

- **Platform Infrastructure** (inherited, high maturity): Gateway, multi-channel messaging, agent runtime, plugin system, security audit framework — all with extensive test coverage and E2E tests.
- **DraftClaw Business Logic** (new, lower maturity): NBA/UFC/Soccer EV engine (`extensions/draft-claw`), The Anchor AI personality (`skills/draft-claw-anchor`), and the User Portal SaaS backend (`src/user-portal`) — with significant gaps identified below.

**6 Critical blockers** were found that prevent safe production deployment. **9 High-severity** issues require resolution before launch.

---

## Severity Classification

| Symbol | Meaning |
|--------|---------|
| **CRITICAL** | Blocks production; causes data loss, security breach, or complete feature failure |
| **HIGH** | Core feature broken or degraded under common conditions |
| **MEDIUM** | Workaround exists; degrades under load or edge cases |
| **LOW** | Technical debt, minor gaps, polish items |

| Category | Meaning |
|----------|---------|
| `[B]` | Broken — code exists but fails at runtime |
| `[S]` | Security — exploitable or data-leaking vulnerability |
| `[M]` | Missing — feature referenced in docs/config/checklist but not implemented |
| `[I]` | Incomplete — feature exists but has material gaps |
| `[P]` | Performance — will degrade under realistic load |

---

## CRITICAL Issues

### C-1 `[B]` Database Migration Runner Only Applies 2 of 5 Migrations

**File:** `src/user-portal/db/run-migrations.ts:11-14`

```ts
const migrations = [
  "001_initial_schema.sql",
  "002_picks_schema.sql",  // ← only these two run
];
```

**Impact:** Three migrations are never applied:
- `002_sports_data_schema.sql` — defines the canonical `events` and `odds_snapshots` tables with columns that `ai-pick-generator.service.ts` queries (`outcome_name`, `american_odds`, `price`, `point`, `sportsbooks` table with `is_sharp`). Without this, the pick generator fails with SQL column-not-found errors at runtime.
- `003_news_and_optimization.sql` — full-text search indexes, news article optimization.
- `004_pick_expiration_cleanup.sql` — pick lifecycle automation.

**Remediation:** Update `run-migrations.ts` to include all 5 migration files in the correct order, and add a `migrations` tracking table to prevent re-execution.

---

### C-2 `[B]` `goat` Subscription Tier Rejected by SQL CHECK Constraint

**Files:**
- `src/user-portal/db/migrations/001_initial_schema.sql:16` — `CHECK (subscription_tier IN ('free', 'pro', 'enterprise'))`
- `src/user-portal/db/migrations/001_initial_schema.sql:30` — `CHECK (plan_id IN ('free', 'pro_monthly', 'pro_yearly', 'enterprise_monthly', 'enterprise_yearly'))`
- `src/user-portal/db/schema.ts:11-15` — TypeScript uses `"free" | "pro" | "goat"` and `"goat_monthly" | "goat_yearly"`

**Impact:** Any attempt to register a `goat` tier user or create a `goat_monthly`/`goat_yearly` subscription will produce a PostgreSQL CHECK constraint violation. The top-tier subscription plans (highest revenue) are completely broken.

**Remediation:** Update the `CHECK` constraints in `001_initial_schema.sql` to include `goat` and `goat_monthly`/`goat_yearly`, then run an `ALTER TABLE` migration on existing deployments.

---

### C-3 `[B]` Stripe Webhook Verifier Uses CommonJS `require()` in ESM Module

**File:** `src/user-portal/stripe/client.ts:249`

```ts
const { createHmac } = require("node:crypto");  // ← ESM files cannot use require()
```

**Impact:** The Stripe webhook signature verification (`verifyWebhookSignature`) will throw `ReferenceError: require is not defined` at runtime because all `.ts` files compile to ESM. **All Stripe webhook events** (subscription upgrades, cancellations, payment failures, invoice paid) will be rejected or throw an unhandled exception. The subscription lifecycle is completely broken.

**Remediation:** Replace line 249 with the existing ESM import pattern already used in `auth/jwt.ts:1`:
```ts
import { createHmac } from "node:crypto";
```
And move the `createHmac` call to use the imported binding.

---

### C-4 `[S]` JWT Fallback Secret Is a Publicly Known String

**File:** `src/user-portal/auth/jwt.ts:19`

```ts
const JWT_SECRET = process.env.DRAFTCLAW_JWT_SECRET
  || process.env.JWT_SECRET
  || "draftclaw-dev-secret-change-in-production";
```

**Impact:** Any deployment without `DRAFTCLAW_JWT_SECRET` set will sign all JWTs with the literal string `"draftclaw-dev-secret-change-in-production"`, which is committed to the public repository. An attacker can forge valid access tokens for any user, including admins.

**Remediation:** At startup, if neither env var is set, throw a fatal error rather than falling back to a known default:
```ts
const JWT_SECRET = process.env.DRAFTCLAW_JWT_SECRET || process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("DRAFTCLAW_JWT_SECRET must be set in production");
```

---

### C-5 `[B]` Admin Dashboard Stats Are Always Zero (In-Memory Stub)

**File:** `src/user-portal/api/admin-routes.ts:32-34`

```ts
// In-memory stores for admin data (replace with database in production)
const allUsers = new Map<string, any>();
const allSubscriptions = new Map<string, any>();
```

**Impact:** `/api/admin/stats` always returns `{ totalUsers: 0, activeSubscriptions: 0, totalRevenue: 0, ... }`. `/api/admin/users` always returns an empty list. `/api/admin/subscriptions` always returns an empty list. `/api/admin/audit-logs` always returns empty. All admin analytics return zeros. The entire admin dashboard is non-functional.

**Remediation:** Replace all in-memory Map references with Supabase queries against the `users`, `subscriptions`, and `usage_records` tables.

---

### C-6 `[M]` No Stripe Webhook Endpoint Registered

**File:** `src/user-portal/api/routes.ts` — confirmed by full read: no `/api/webhooks/stripe` route exists in the current file.

> **Note:** The code block in `routes.ts` starting at line 407 (`app.post("/api/webhooks/stripe", ...)`) *is present* in the file. Cross-referencing with C-3: the endpoint is registered, but the signature verifier it calls (`stripeClient.verifyWebhookSignature`) will always throw due to the `require()` bug. The effective result is that all webhook events fail. C-3 must be fixed for C-6 to be resolved.

**Updated Status:** The route exists. C-3 is the root cause. C-6 is downgraded — resolving C-3 is sufficient.

---

## HIGH Issues

### H-1 `[S]` CORS Wildcard Default in Production

**File:** `src/user-portal/api/routes.ts:13-18`

```ts
app.use("/*", cors({
  origin: process.env.DRAFTCLAW_PORTAL_ORIGIN || "*",
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));
```

**Impact:** If `DRAFTCLAW_PORTAL_ORIGIN` is not set, any website can make credentialed cross-origin requests (with `Authorization` headers) to the portal. This enables CSRF-style attacks and cross-origin data exfiltration.

**Env Var Gap:** `DRAFTCLAW_PORTAL_ORIGIN` is in `.env.example` but has no startup-time validation.

**Remediation:** Fail-closed: default to `"https://draftclaw.ai"` (or throw) rather than `"*"`. Add env var validation on startup.

---

### H-2 `[I]` Admin Role Is Subscription Tier, Not RBAC

**File:** `src/user-portal/api/admin-routes.ts:19-23`

```ts
// In production, use a proper admin role system
const isAdmin = subscription?.planId?.includes("goat") ||
  result.user.email?.endsWith("@draftclaw.ai");
```

**Impact:** Any legitimate `goat` subscriber gains full admin access: viewing all users, triggering AI pick generation, restarting background services. Email-based check can be bypassed if email update validation is insufficient.

**Remediation:** Add an `is_admin` boolean column to the `users` table. Set it explicitly for verified staff accounts only.

---

### H-3 `[M]` No Rate Limiting on Authentication Endpoints

**File:** `src/user-portal/api/routes.ts` — no rate-limiting middleware applied to `/api/auth/login`, `/api/auth/register`, `/api/auth/refresh`

**Impact:** Brute-force password attacks, credential stuffing, and account enumeration (via register endpoint) are completely unmitigated. A single IP can make unlimited login attempts.

**Remediation:** Add IP-based rate limiting (e.g., 10 requests/minute on login, 5 registrations/hour per IP). Consider using `hono-rate-limiter` or a Redis-backed counter.

---

### H-4 `[B]` Duplicate Migration File Numbers / Schema Drift

**Files:**
- `src/user-portal/db/migrations/002_picks_schema.sql` (run) — defines `events` with only 3 sport values, `odds_snapshots` with columns `outcome`, `odds`, `line`
- `src/user-portal/db/migrations/002_sports_data_schema.sql` (NOT run) — defines `events` with 8 sport values + `status`, `external_id UNIQUE`; defines `odds_snapshots` with `outcome_name`, `price`, `american_odds`, `implied_probability`

**Impact:** The service layer (`ai-pick-generator.service.ts:174-184`) queries `outcome_name`, `price`, `american_odds`, `is_sharp` — columns that only exist in the un-run `002_sports_data_schema.sql`. At runtime, every pick generation attempt will fail with `column "outcome_name" does not exist`.

**Remediation:** Renumber `002_sports_data_schema.sql` to `003` (and shift others), add it to the migration runner, and remove the conflicting table definitions from `002_picks_schema.sql`. Run a reconciliation migration on any existing DB.

---

### H-5 `[B]` Odds API Provider Fallback Sends Wrong Endpoint Paths

**File:** `src/user-portal/services/odds-api.service.ts:98-108`

```ts
async getOdds(sport: string, market: string = 'h2h') {
  return this.tryAllProviders('/odds', { sport, market });
}
async getEvents(sport: string) {
  return this.tryAllProviders('/events', { sport });
}
```

**Impact:** The fallback strategy sends identical REST paths (`/odds`, `/events`) to all three providers. TheOddsAPI uses these paths; Sportradar uses `/nba/trial/v8/en/games/{date}/schedule.json`-style paths; SportsData.io uses `/v3/nba/odds/json/GameOddsByDate/{date}`. The Sportradar and SportsData fallback paths will produce HTTP 404 responses, making them non-functional as fallbacks.

**Remediation:** Implement provider-specific adapters that translate the common query interface into each provider's actual endpoint schema.

---

### H-6 `[I]` EV Calculation Methodology Mismatch Between Extension and Portal

**Files:**
- `extensions/draft-claw/src/analysis.ts:54` — uses proper decimal-odds EV: `(decimalOdds * trueProb - 1) * 100`
- `src/user-portal/services/ai-pick-generator.service.ts:222` — uses `Math.abs(avgRetailLine - avgSharpLine) / 10` as edge proxy

**Impact:** The Anchor AI personality gets its data from the extension's EV calculation. The portal's picks are generated using a completely different edge formula. Picks from the two systems are not comparable and will produce inconsistent confidence scores and recommendations for the same event.

**Remediation:** Unify the EV calculation. Extract the proven decimal-odds EV formula from `extensions/draft-claw/src/analysis.ts` into a shared utility package. Use it in both the extension and the portal's pick generator.

---

### H-7 `[I]` Extension Ships in Mock Mode by Default

**File:** `extensions/draft-claw/draftclaw.plugin.json`

```json
"mockMode": { "default": true }
```

**File:** `extensions/draft-claw/index.ts:34`

```ts
const apiKey = config.apiKey ?? "";  // empty string if not configured
```

**Impact:** Without explicitly setting `mockMode: false` and providing a real `ODDS_API_KEY`, the EV engine always returns mock data (hardcoded Celtics vs Nuggets analysis). Users may follow Anchor broadcasts based on fake data. The configuration path to enable live mode is not documented for end users.

**Remediation:** Add prominent documentation in `README.md` and `SKILL.md` explaining the `mockMode` config. Add a startup warning log when `mockMode: true` is active. Validate that `apiKey` is non-empty when `mockMode: false`.

---

### H-8 `[I]` Email Verification Not Enforced at Login or Route Access

**File:** `src/user-portal/auth/service.ts:121-161`

```ts
async login(data: LoginData): Promise<AuthResult> {
  // ... verifies password ...
  // ← no check for emailVerified === true
  const tokens = createTokenPair(user);
```

**Impact:** Users can log in and access all protected routes without verifying their email address. The `email_verified` field is stored but never gated on. This enables account takeover via typo-squatting email registration and bypasses email-as-identity verification for WhatsApp linking.

**Remediation:** Either enforce email verification before login (block with a `403` and prompt to verify), or enforce it only for sensitive operations (WhatsApp linking, subscription upgrades).

---

### H-9 `[I]` `Promise.all` Used Instead of `Promise.race` for "Fastest" Provider Strategy

**File:** `src/user-portal/services/odds-api.service.ts:64-77`

```ts
if (this.fallbackStrategy === 'fastest') {
  const requests = this.providers.map(provider =>
    this.makeRequest(provider, endpoint, params).catch(...)
  );
  const responses = await Promise.all(requests);  // waits for ALL
  const successfulResponse = responses.find(response => !response.error);
```

**Impact:** `Promise.all` waits for all providers to complete before returning. The slowest provider (or a 5-second timeout) determines total latency. The "fastest" strategy behaves identically to "sequential" in terms of total wall time.

**Remediation:** Implement using `Promise.race` with error filtering, or use `Promise.any` (Node 15+) which resolves with the first successful promise.

---

## MEDIUM Issues

### M-1 `[P]` Three Independent PostgreSQL Connection Pools

**Files:**
- `src/user-portal/services/ai-pick-generator.service.ts:31` — `new Pool(...)`
- `src/user-portal/services/odds-sync.service.ts:9` — `new Pool(...)`
- `src/user-portal/services/news-feed.service.ts:33` — `new Pool(...)`

**Impact:** Three separate pools with default `pg` settings (max 10 connections each) = up to 30 simultaneous connections. Supabase free tier allows 15-20. Under concurrent service load, connection exhaustion errors will occur.

**Remediation:** Create a shared singleton Pool module and import it in all services.

---

### M-2 `[I]` Sharp/Soft Book Lists Diverge Between Extension and Portal Database

**Files:**
- `extensions/draft-claw/src/bookmakers.ts:41` — hardcoded `["pinnacle", "lowvig", "betcris", "circa"]`
- Portal: `sportsbooks` table with `is_sharp` column (from un-run migration `002_sports_data_schema.sql`)

**Impact:** If the `sportsbooks` table (once migrated) has different `is_sharp` assignments than the hardcoded list in the extension, EV calculations from the extension and portal picks will be based on inconsistent sharp-book consensus.

**Remediation:** Single source of truth: either hardcode both from the same list, or have the extension query the database for the sharp book list.

---

### M-3 `[I]` No API Quota Monitoring or Circuit Breaker

**Files:** All three odds/news services lack quota tracking

**Impact:** TheOddsAPI charges per request. Without quota monitoring, the system will silently exhaust the daily quota, causing all subsequent sync cycles to return 401/429 errors until midnight. No alerting, no circuit breaker, no fallback to cached data.

**Remediation:** Track API call counts in Redis or the database. Alert when >80% of quota consumed. Increase sync interval when quota is low.

---

### M-4 `[I]` Password Reset Token Returned in API Response (Not Emailed)

**File:** `src/user-portal/auth/service.ts:452`

```ts
return { success: true, token }; // In production, send this via email
```

**Impact:** Password reset tokens are returned in the API response body rather than sent via email. An attacker intercepting API responses (MITM, XSS) gets the reset token. There is no actual email delivery mechanism implemented.

**Remediation:** Remove `token` from the response. Implement transactional email (Resend, Postmark, or SES) to deliver the reset link.

---

### M-5 `[I]` Naive Keyword-Based Sentiment Analysis

**File:** `src/user-portal/services/ai-pick-generator.service.ts:265-278`

```ts
const positiveWords = ['win', 'victory', 'excellent', 'strong', 'dominant', ...];
const negativeWords = ['loss', 'defeat', 'injury', 'struggle', 'weak', ...];
```

**Impact:** The sentiment classifier is a naive keyword counter. Common false positives: "injury scare behind him, player cleared to WIN" scores -1 positive (win) and +1 negative (injury), net neutral when it should be positive. This directly affects pick confidence scores.

**Remediation:** Replace with a proper NLP sentiment model or leverage the Claude API for news analysis (which is already available in the stack).

---

### M-6 `[B]` Data Pipeline Test File Has Broken Import Paths

**File:** `src/user-portal/test/data-pipeline.test.ts:322-348`

```ts
const seoPath = './components/SEOHead';    // file does not exist
const cronPath = './supabase/migrations/004_cron_jobs.sql';  // wrong relative path
```

**Impact:** These test cases will always fail with module-not-found / file-not-found errors. The test is also not included in the main vitest configuration (`vitest.config.ts` only covers `src/**/*.test.ts` in the standard exclude pattern, and `src/user-portal/test/` uses Jest-style `describe/it` not Vitest's).

**Remediation:** Fix import paths. Add to vitest config. Convert to Vitest `test()` syntax.

---

### M-7 `[I]` Usage Limits Tracked But Not Enforced

**File:** `src/user-portal/usage/service.ts` — `checkUsageLimit()` exists but is never called from routes

**Impact:** `PLAN_LIMITS` defines per-plan API call/message/token limits, but no route checks these limits before processing requests. Free tier users can make unlimited API calls.

**Remediation:** Add a `checkAndEnforceLimit` middleware that calls `checkUsageLimit()` and returns `429 Too Many Requests` when the limit is exceeded.

---

## LOW Issues

### L-1 `[I]` `date-fns` Listed as Extension Dependency But Never Used

**File:** `extensions/draft-claw/package.json` — lists `date-fns` dependency; none of the 4 source files import it.

**Remediation:** Remove from `package.json`.

---

### L-2 `[I]` BetMGM Affiliate ID Is Always Hardcoded

**File:** `extensions/draft-claw/src/bookmakers.ts:28` — `?? "draftclaw"` hardcoded.
**Config schema** in `draftclaw.plugin.json` only exposes `fanduel` and `draftkings` affiliate ID config.

**Remediation:** Add `betmgm` to the affiliates config schema.

---

### L-3 `[I]` `Sportradar GLOBAL_BASKETBALL_HOST` and `SPORTRADAR_SOCCER_*` Env Vars Not in `.env.example`

**Evidence:** `grep` of `src/user-portal/` shows `SPORTRADAR_GLOBAL_BASKETBALL_HOST`, `SPORTRADAR_GLOBAL_BASKETBALL_KEY`, `SPORTRADAR_MMA_API_KEY`, `SPORTRADAR_MMA_HOST`, `SPORTRADAR_SOCCER_API_KEY`, `SPORTRADAR_SOCCER_HOST`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SPORTSDATA_REPLAY_API_HOST` are used in source but not documented in `.env.example`.

**Remediation:** Add all missing env vars to `.env.example` with descriptions.

---

### L-4 `[I]` Extension Tests Excluded From CI

**File:** `vitest.unit.config.ts:17` — `exclude: [...exclude, "extensions/**"]`

Zero test files exist for `extensions/draft-claw/`. The EV calculation, bookmaker classification, and tool integration have no automated regression protection.

**Remediation:** Add unit tests for `analysis.ts` (EV formula correctness), `bookmakers.ts` (sharp/soft classification), and `index.ts` (tool registration and mock-mode behavior). Remove `extensions/**` from test exclusion.

---

### L-5 `[I]` Admin Revenue Analytics Reference Non-Existent `enterprise` Plans

**File:** `src/user-portal/api/admin-routes.ts:254-260`

```ts
revenueByPlan: {
  pro_monthly: 0,
  pro_yearly: 0,
  enterprise_monthly: 0,   // ← plan does not exist in TypeScript schema
  enterprise_yearly: 0,    // ← plan does not exist in TypeScript schema
}
```

**Remediation:** Change to `goat_monthly`/`goat_yearly` to match the actual plan IDs.

---

## Environment Variable Audit

Variables used in `src/user-portal/` source but **missing from `.env.example`**:

| Variable | Used In | Risk |
|----------|---------|------|
| `SUPABASE_URL` | `db/supabase-client.ts` | Required — DB connection fails without it |
| `SUPABASE_SERVICE_ROLE_KEY` | `db/supabase-client.ts` | Required — DB auth fails without it |
| `SPORTRADAR_BASKETBALL_API_KEY` | `odds-api.service.ts` | Required for fallback |
| `SPORTRADAR_SOCCER_API_KEY` | `odds-api.service.ts` | Required for fallback |
| `SPORTRADAR_GLOBAL_BASKETBALL_KEY` | `odds-api.service.ts` | Required for fallback |
| `SPORTRADAR_MMA_API_KEY` | `odds-api.service.ts` | Required for fallback |
| `SPORTSDATA_REPLAY_API_HOST` | `sportsdata-api.service.ts` | Optional |
| `DRAFTCLAW_JWT_SECRET` | `auth/jwt.ts` | **Required** — defaults to known insecure string |
| `DRAFTCLAW_STRIPE_SECRET_KEY` | `stripe/client.ts` | Alias for STRIPE_SECRET_KEY |
| `DRAFTCLAW_STRIPE_WEBHOOK_SECRET` | `stripe/client.ts` | Alias for STRIPE_WEBHOOK_SECRET |

Variables with **unsafe defaults** (not documented as such):

| Variable | Default | Risk |
|----------|---------|------|
| `DRAFTCLAW_JWT_SECRET` | `"draftclaw-dev-secret-change-in-production"` | CRITICAL — publicly known |
| `DRAFTCLAW_PORTAL_ORIGIN` | `"*"` | HIGH — CORS wildcard |
| `STRIPE_PRICE_PRO_MONTHLY` | `"price_pro_monthly"` | HIGH — invalid Stripe price ID |
| `STRIPE_PRICE_PRO_YEARLY` | `"price_pro_yearly"` | HIGH — invalid Stripe price ID |
| `STRIPE_PRICE_GOAT_MONTHLY` | `"price_goat_monthly"` | HIGH — invalid Stripe price ID |
| `STRIPE_PRICE_GOAT_YEARLY` | `"price_goat_yearly"` | HIGH — invalid Stripe price ID |

---

## Test Coverage Gaps

| Feature Area | Test File Exists | In CI Config | Notes |
|---|---|---|---|
| EV calculation engine | No | No | Zero tests for `extensions/draft-claw/` |
| Moneyball pick generation | No | No | `ai-pick-generator.service.ts` untested |
| Odds sync pipeline | No | No | `odds-sync.service.ts` untested |
| Auth (register/login/refresh) | No | No | `auth/service.ts` untested |
| JWT implementation | No | No | `auth/jwt.ts` untested |
| Stripe billing | No | No | `stripe/subscription-service.ts` untested |
| Usage tracking | No | No | `usage/service.ts` untested |
| Admin routes | No | No | `api/admin-routes.ts` untested |
| Picks API | No | No | `picks/routes.ts` untested |
| Data pipeline test | Yes (broken) | No | Import paths broken; not in vitest config |
| Gateway (core) | Yes | Yes | Extensive E2E + unit tests |
| Agent runtime | Yes | Yes | 100+ test files |
| Memory system | Yes | Yes | 8+ unit test files |
| Security audit | Yes | Yes | `audit.test.ts` present |

**The entire `src/user-portal/` is effectively untested in CI.**

---

## Summary Table

| ID | Severity | Category | Area | One-Line Description |
|----|---------|---------|------|---------------------|
| C-1 | Critical | B | Database | Migration runner only applies 2 of 5 migrations |
| C-2 | Critical | B | Database | `goat` tier rejected by SQL CHECK constraints |
| C-3 | Critical | B | Billing | Stripe webhook verifier uses `require()` in ESM |
| C-4 | Critical | S | Auth | JWT fallback secret is a known public string |
| C-5 | Critical | B | Admin | Admin dashboard always returns zeros (in-memory stub) |
| H-1 | High | S | Auth | CORS defaults to `*` if env var not set |
| H-2 | High | I | Auth | Admin role checked via subscription tier, not RBAC |
| H-3 | High | M | Auth | No rate limiting on auth endpoints |
| H-4 | High | B | Database | Duplicate `002` migrations cause schema drift |
| H-5 | High | B | Data Pipeline | Odds provider fallback sends wrong endpoint paths |
| H-6 | High | I | Business Logic | EV formula inconsistency between extension and portal |
| H-7 | High | I | Extension | Extension ships in mock mode by default |
| H-8 | High | I | Auth | Email verification field exists but is never enforced |
| H-9 | High | I | Data Pipeline | `Promise.all` used where `Promise.race` is needed |
| M-1 | Medium | P | Infrastructure | Three independent DB connection pools |
| M-2 | Medium | I | Business Logic | Sharp book list has two sources of truth |
| M-3 | Medium | M | Infrastructure | No API quota monitoring or circuit breaker |
| M-4 | Medium | I | Auth | Password reset token returned in response, not emailed |
| M-5 | Medium | I | Business Logic | Naive keyword sentiment analysis |
| M-6 | Medium | B | Testing | Data pipeline test has broken import paths |
| M-7 | Medium | I | Billing | Usage limits tracked but never enforced |
| L-1 | Low | I | Extension | Unused `date-fns` dependency |
| L-2 | Low | I | Extension | BetMGM affiliate ID always hardcoded |
| L-3 | Low | I | Config | Missing env vars in `.env.example` |
| L-4 | Low | I | Testing | Extension tests excluded from CI |
| L-5 | Low | I | Admin | Revenue analytics references non-existent plan names |

---

## Recommended Fix Order

**Phase 1 — Before Any Production Traffic:**
1. C-4: JWT secret — add startup validation
2. C-3: Stripe ESM `require` — one-line fix
3. C-1: Migration runner — add all 5 migrations
4. C-2: SQL CHECK constraints — update to include `goat` tiers
5. H-1: CORS — set a restrictive default
6. H-3: Rate limiting — add auth endpoint middleware

**Phase 2 — Before Paid Users:**
1. C-5: Admin dashboard — implement real DB queries
2. H-4: Schema drift — reconcile duplicate `002` migrations
3. H-5: Provider fallback — implement provider-specific adapters or remove non-TheOddsAPI providers for now
4. M-7: Usage limit enforcement — add limit-checking middleware
5. H-8: Email verification enforcement
6. M-4: Password reset — implement email delivery

**Phase 3 — Before Marketing Launch:**
1. H-6: Unify EV calculation formula
2. H-7: Document mock-mode configuration
3. H-2: Implement proper RBAC for admin
4. M-1: Shared DB connection pool
5. M-3: API quota monitoring
6. L-4: Add extension unit tests
