import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveGatewayStateDir } from "./paths.js";

describe("resolveGatewayStateDir", () => {
  it("uses the default state dir when no overrides are set", () => {
    const env = { HOME: "/Users/test" };
    expect(resolveGatewayStateDir(env)).toBe(path.join("/Users/test", ".draftclaw"));
  });

  it("appends the profile suffix when set", () => {
    const env = { HOME: "/Users/test", DRAFTCLAW_PROFILE: "rescue" };
    expect(resolveGatewayStateDir(env)).toBe(path.join("/Users/test", ".draftclaw-rescue"));
  });

  it("treats default profiles as the base state dir", () => {
    const env = { HOME: "/Users/test", DRAFTCLAW_PROFILE: "Default" };
    expect(resolveGatewayStateDir(env)).toBe(path.join("/Users/test", ".draftclaw"));
  });

  it("uses DRAFTCLAW_STATE_DIR when provided", () => {
    const env = { HOME: "/Users/test", DRAFTCLAW_STATE_DIR: "/var/lib/draftclaw" };
    expect(resolveGatewayStateDir(env)).toBe(path.resolve("/var/lib/draftclaw"));
  });

  it("expands ~ in DRAFTCLAW_STATE_DIR", () => {
    const env = { HOME: "/Users/test", DRAFTCLAW_STATE_DIR: "~/draftclaw-state" };
    expect(resolveGatewayStateDir(env)).toBe(path.resolve("/Users/test/draftclaw-state"));
  });

  it("preserves Windows absolute paths without HOME", () => {
    const env = { DRAFTCLAW_STATE_DIR: "C:\\State\\draftclaw" };
    expect(resolveGatewayStateDir(env)).toBe("C:\\State\\draftclaw");
  });
});
