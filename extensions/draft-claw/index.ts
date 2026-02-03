import type { DraftClawPluginApi } from "../../src/plugins/types.js";
import { DraftClawClient } from "./src/client.js";
import type { DraftClawConfig } from "./src/types.js";
import { z } from "zod";

const ClawSheetOutputSchema = z.object({
  timestamp: z.string(),
  mode: z.enum(["mock", "live"]),
  analyses: z.array(
    z.object({
      game: z.string(),
      market: z.string(),
      recommendation: z.enum(["Bet Home", "Bet Away", "Bet Over", "Bet Under"]),
      impliedProbability: z.number(),
      clawProbability: z.number(),
      edge: z.number(),
      confidence: z.enum(["High", "Medium", "Low"]),
      reasoning: z.string(),
      deepLink: z.string(),
    })
  ),
  summary: z.object({
    totalGames: z.number(),
    opportunitiesFound: z.number(),
    highConfidence: z.number(),
  }),
});

export default function register(api: DraftClawPluginApi) {
  const config = api.getConfig() as DraftClawConfig;

  const resolvedConfig: DraftClawConfig = {
    apiKey: config.apiKey ?? "",
    mockMode: config.mockMode ?? true,
    minEdgePercentage: config.minEdgePercentage ?? 2.5,
    affiliates: config.affiliates ?? {},
  };

  const client = new DraftClawClient(resolvedConfig);

  api.registerTool(
    {
      name: "get_nba_briefing",
      description:
        "Fetches the current NBA slate and analyzes betting markets for Expected Value (EV) opportunities. Returns 'The Claw Sheet' containing games with positive EV edges compared to sharp bookmakers, along with affiliate deep links.",
      parameters: z.object({}),
      execute: async () => {
        try {
          const clawSheet = await client.getClawSheet();
          return ClawSheetOutputSchema.parse(clawSheet);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error fetching NBA briefing";
          return {
            error: true,
            message,
            timestamp: new Date().toISOString(),
          };
        }
      },
    },
    { optional: true }
  );
}
