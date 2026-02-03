# DraftClaw User Portal

Production-ready user account and subscription management system for DraftClaw.

## Features

- **User Authentication**: Email/password registration and login with JWT tokens
- **WhatsApp Linking**: Connect user accounts to WhatsApp sessions
- **Subscription Management**: Stripe-powered billing with Free, Pro, and Enterprise tiers
- **Usage Tracking**: Monitor API calls, messages, AI tokens, and media uploads
- **Admin Dashboard**: User management, subscription oversight, and analytics
- **Production Ready**: Docker deployment, health checks, and monitoring

## Quick Start

### Development

```bash
# Install dependencies
pnpm install

# Copy environment config
cp src/user-portal/.env.example src/user-portal/.env

# Edit .env with your Stripe keys and other config
# Then start the portal
pnpm portal:dev
```

### Production (Docker)

```bash
cd src/user-portal

# Copy and configure environment
cp .env.example .env
# Edit .env with production values

# Start the stack
docker-compose up -d

# View logs
docker-compose logs -f portal
```

## Configuration

### Required Environment Variables

| Variable | Description |
|----------|-------------|
| `DRAFTCLAW_JWT_SECRET` | Secret key for JWT signing (64+ chars) |
| `STRIPE_SECRET_KEY` | Stripe API secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `DATABASE_URL` | PostgreSQL connection string |

### Stripe Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Create products and prices in the Stripe Dashboard:
   - **Pro Monthly**: $29/month
   - **Pro Yearly**: $290/year
   - **GOAT Monthly**: $99/month
   - **GOAT Yearly**: $990/year
3. Copy the price IDs to your `.env` file
4. Configure the Customer Portal in Stripe Dashboard
5. Set up webhook endpoint: `https://your-domain.com/api/webhooks/stripe`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.paid`
     - `invoice.payment_failed`

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Login and get tokens |
| POST | `/api/auth/logout` | Invalidate refresh token |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |

### User Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/profile` | Get current user profile |
| PUT | `/api/user/profile` | Update profile |
| POST | `/api/user/change-password` | Change password |
| POST | `/api/user/link-whatsapp` | Link WhatsApp account |
| POST | `/api/user/unlink-whatsapp` | Unlink WhatsApp account |

### Subscriptions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/subscription` | Get subscription details |
| POST | `/api/user/subscription/checkout` | Create checkout session |
| POST | `/api/user/subscription/portal` | Get billing portal URL |
| POST | `/api/user/subscription/cancel` | Cancel subscription |
| POST | `/api/user/subscription/reactivate` | Reactivate subscription |

### Usage

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/usage` | Get current period usage |

### Admin (Enterprise only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/admin/users` | List all users |
| GET | `/api/admin/users/:id` | Get user details |
| PUT | `/api/admin/users/:id` | Update user |
| GET | `/api/admin/subscriptions` | List subscriptions |
| GET | `/api/admin/analytics/usage` | Usage analytics |
| GET | `/api/admin/analytics/revenue` | Revenue analytics |
| GET | `/api/admin/audit-logs` | Audit logs |
| GET | `/api/admin/health` | System health |

## Plan Limits

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| API Calls/month | 1,000 | 50,000 | Unlimited |
| Messages/month | 500 | 10,000 | Unlimited |
| AI Tokens/month | 50,000 | 1,000,000 | Unlimited |
| Media Uploads | 100 MB | 5 GB | Unlimited |
| WhatsApp Accounts | 1 | 5 | Unlimited |
| Team Members | 1 | 5 | Unlimited |
| Priority Support | ❌ | ✅ | ✅ |
| Custom Branding | ❌ | ✅ | ✅ |

## Database Schema

The portal uses PostgreSQL with the following main tables:

- `users` - User accounts and profiles
- `subscriptions` - Subscription records
- `usage_records` - Usage tracking
- `sessions` - JWT session management
- `audit_logs` - Activity logging

Run migrations:

```bash
psql $DATABASE_URL -f src/user-portal/db/migrations/001_initial_schema.sql
```

## Security

- Passwords hashed with scrypt (N=16384, r=8, p=1)
- JWT tokens with 15-minute access / 7-day refresh
- CORS protection with configurable origins
- Rate limiting (100 requests per 15 minutes default)
- Webhook signature verification
- Audit logging for sensitive operations

## Monitoring

- Health check endpoint: `GET /health`
- Admin health dashboard: `GET /api/admin/health`
- Docker healthcheck built-in
- Supports Sentry error tracking (optional)

## Architecture

```
src/user-portal/
├── api/
│   ├── routes.ts         # Main API routes
│   └── admin-routes.ts   # Admin endpoints
├── auth/
│   ├── jwt.ts            # JWT token handling
│   ├── password.ts       # Password hashing
│   └── service.ts        # Auth service
├── db/
│   ├── schema.ts         # TypeBox schemas
│   └── migrations/       # SQL migrations
├── stripe/
│   ├── client.ts         # Stripe API client
│   └── subscription-service.ts
├── usage/
│   └── service.ts        # Usage tracking
├── ui/
│   └── portal-app.ts     # Lit web components
├── index.ts              # Entry point
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## Integration with DraftClaw

The user portal integrates with the main DraftClaw application:

1. **WhatsApp Linking**: Users link their WhatsApp sessions to their portal account
2. **Usage Tracking**: DraftClaw reports usage metrics to the portal
3. **Subscription Gating**: DraftClaw checks subscription tier for feature access

```typescript
import { authService, subscriptionService, usageService } from './user-portal';

// Check user subscription before processing
const user = await authService.getUserByWhatsApp(whatsappJid);
if (user) {
  const subscription = await subscriptionService.getUserSubscription(user.id);
  const limits = subscriptionService.getPlanLimits(subscription?.planId || 'free');
  
  // Check if within limits
  const check = await usageService.checkUsageLimit({
    userId: user.id,
    metricType: 'messages_sent',
    limit: limits.messagesPerMonth,
  });
  
  if (!check.allowed) {
    // User has exceeded their plan limits
  }
  
  // Record usage
  await usageService.incrementMessagesSent(user.id);
}
```

## License

MIT - See LICENSE file in root directory.
