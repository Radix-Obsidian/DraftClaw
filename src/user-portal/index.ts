// DraftClaw User Portal - Main Entry Point
// Production-ready user account and subscription management system

export * from "./db/schema.js";
export * from "./auth/jwt.js";
export * from "./auth/password.js";
export * from "./auth/service.js";
export * from "./stripe/client.js";
export * from "./stripe/subscription-service.js";
export * from "./usage/service.js";
export { userPortalRoutes } from "./api/routes.js";

import { serve } from "@hono/node-server";
import { userPortalRoutes } from "./api/routes.js";
import { serviceManager } from "./services/service-manager.js";

const PORT = parseInt(process.env.DRAFTCLAW_PORTAL_PORT || "3001", 10);

export async function startUserPortalServer(port = PORT) {
  console.log(`🚀 DraftClaw User Portal starting on port ${port}...`);
  
  // Start background services (odds sync, news feed, AI pick generator)
  try {
    await serviceManager.startAll();
    console.log(`✅ Background services started`);
  } catch (error) {
    console.error(`⚠️  Warning: Some background services failed to start:`, error);
    // Continue anyway - server can still handle requests
  }
  
  serve({
    fetch: userPortalRoutes.fetch,
    port,
  });

  console.log(`✅ User Portal running at http://localhost:${port}`);
  console.log(`📚 API Docs: http://localhost:${port}/health`);
  console.log(`🤖 AI Pick Generation: Active`);
  console.log(`📰 News Feed Sync: Active`);
  console.log(`📊 Odds Sync: Active`);
  
  return { port };
}

// Start server if running directly
if (process.argv[1]?.includes("user-portal")) {
  startUserPortalServer();
}
