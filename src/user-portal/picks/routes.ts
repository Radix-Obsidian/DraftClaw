import { Hono } from "hono";
import { picksService, type Sport } from "./service.js";

export const picksRouter = new Hono();

// GET /api/picks - Get all active picks (optionally filtered by sport)
picksRouter.get("/", async (c) => {
  const sport = c.req.query("sport") as Sport | undefined;

  // Validate sport parameter if provided
  if (sport && !["NBA", "UFC", "Soccer"].includes(sport)) {
    return c.json({ error: "Invalid sport. Must be NBA, UFC, or Soccer" }, 400);
  }

  const picks = await picksService.getActivePicks(sport);

  // Add caching headers for efficiency
  c.header("Cache-Control", "public, max-age=60, stale-while-revalidate=840");

  return c.json({
    success: true,
    data: picks,
    meta: {
      count: picks.length,
      sport: sport || "all",
      timestamp: new Date().toISOString(),
    },
  });
});

// GET /api/picks/nba - Get NBA picks
picksRouter.get("/nba", async (c) => {
  const picks = await picksService.getPicksBySport("NBA");

  c.header("Cache-Control", "public, max-age=60, stale-while-revalidate=840");

  return c.json({
    success: true,
    data: picks,
    meta: {
      count: picks.length,
      sport: "NBA",
      timestamp: new Date().toISOString(),
    },
  });
});

// GET /api/picks/ufc - Get UFC picks
picksRouter.get("/ufc", async (c) => {
  const picks = await picksService.getPicksBySport("UFC");

  c.header("Cache-Control", "public, max-age=60, stale-while-revalidate=840");

  return c.json({
    success: true,
    data: picks,
    meta: {
      count: picks.length,
      sport: "UFC",
      timestamp: new Date().toISOString(),
    },
  });
});

// GET /api/picks/soccer - Get Soccer picks
picksRouter.get("/soccer", async (c) => {
  const picks = await picksService.getPicksBySport("Soccer");

  c.header("Cache-Control", "public, max-age=60, stale-while-revalidate=840");

  return c.json({
    success: true,
    data: picks,
    meta: {
      count: picks.length,
      sport: "Soccer",
      timestamp: new Date().toISOString(),
    },
  });
});

// GET /api/picks/locks - Get all lock picks
picksRouter.get("/locks", async (c) => {
  const picks = await picksService.getPicksByType("lock");

  c.header("Cache-Control", "public, max-age=60, stale-while-revalidate=840");

  return c.json({
    success: true,
    data: picks,
    meta: {
      count: picks.length,
      type: "lock",
      timestamp: new Date().toISOString(),
    },
  });
});

// GET /api/picks/longshots - Get all longshot picks
picksRouter.get("/longshots", async (c) => {
  const picks = await picksService.getPicksByType("longshot");

  c.header("Cache-Control", "public, max-age=60, stale-while-revalidate=840");

  return c.json({
    success: true,
    data: picks,
    meta: {
      count: picks.length,
      type: "longshot",
      timestamp: new Date().toISOString(),
    },
  });
});

// GET /api/picks/traps - Get all trap picks
picksRouter.get("/traps", async (c) => {
  const picks = await picksService.getPicksByType("trap");

  c.header("Cache-Control", "public, max-age=60, stale-while-revalidate=840");

  return c.json({
    success: true,
    data: picks,
    meta: {
      count: picks.length,
      type: "trap",
      timestamp: new Date().toISOString(),
    },
  });
});

// GET /api/picks/ticker - Get ticker items
picksRouter.get("/ticker", async (c) => {
  const ticker = await picksService.getTicker();

  c.header("Cache-Control", "public, max-age=30, stale-while-revalidate=60");

  return c.json({
    success: true,
    data: ticker,
    meta: {
      count: ticker.length,
      timestamp: new Date().toISOString(),
    },
  });
});

// GET /api/picks/briefing - Get daily briefing
picksRouter.get("/briefing", async (c) => {
  const briefing = await picksService.getDailyBriefing();

  c.header("Cache-Control", "public, max-age=60, stale-while-revalidate=840");

  return c.json({
    success: true,
    data: briefing,
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
});

// GET /api/picks/:id - Get pick details by ID
picksRouter.get("/:id", async (c) => {
  const id = c.req.param("id");

  if (!id) {
    return c.json({ error: "Pick ID is required" }, 400);
  }

  const pick = await picksService.getPickById(id);

  if (!pick) {
    return c.json({ error: "Pick not found" }, 404);
  }

  c.header("Cache-Control", "public, max-age=60, stale-while-revalidate=840");

  return c.json({
    success: true,
    data: pick,
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
});

export default picksRouter;
