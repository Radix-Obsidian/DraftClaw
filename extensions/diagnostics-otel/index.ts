import type { DraftClawPluginApi } from "draftclaw/plugin-sdk";
import { emptyPluginConfigSchema } from "draftclaw/plugin-sdk";
import { createDiagnosticsOtelService } from "./src/service.js";

const plugin = {
  id: "diagnostics-otel",
  name: "Diagnostics OpenTelemetry",
  description: "Export diagnostics events to OpenTelemetry",
  configSchema: emptyPluginConfigSchema(),
  register(api: DraftClawPluginApi) {
    api.registerService(createDiagnosticsOtelService());
  },
};

export default plugin;
