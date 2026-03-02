const REQUIRED_ENV_VARS = [
  "DATABASE_URL",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DRAFTCLAW_JWT_SECRET",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_PRO_MONTHLY",
  "STRIPE_PRICE_PRO_YEARLY",
  "STRIPE_PRICE_GOAT_MONTHLY",
  "STRIPE_PRICE_GOAT_YEARLY",
];

export function validateEnv(): void {
  const missing = REQUIRED_ENV_VARS.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}\n` +
        `Copy .env.example to .env and fill in all values before starting.`
    );
  }
}
