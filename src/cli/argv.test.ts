import { describe, expect, it } from "vitest";
import {
  buildParseArgv,
  getFlagValue,
  getCommandPath,
  getPrimaryCommand,
  getPositiveIntFlagValue,
  getVerboseFlag,
  hasHelpOrVersion,
  hasFlag,
  shouldMigrateState,
  shouldMigrateStateFromPath,
} from "./argv.js";

describe("argv helpers", () => {
  it("detects help/version flags", () => {
    expect(hasHelpOrVersion(["node", "draftclaw", "--help"])).toBe(true);
    expect(hasHelpOrVersion(["node", "draftclaw", "-V"])).toBe(true);
    expect(hasHelpOrVersion(["node", "draftclaw", "status"])).toBe(false);
  });

  it("extracts command path ignoring flags and terminator", () => {
    expect(getCommandPath(["node", "draftclaw", "status", "--json"], 2)).toEqual(["status"]);
    expect(getCommandPath(["node", "draftclaw", "agents", "list"], 2)).toEqual(["agents", "list"]);
    expect(getCommandPath(["node", "draftclaw", "status", "--", "ignored"], 2)).toEqual(["status"]);
  });

  it("returns primary command", () => {
    expect(getPrimaryCommand(["node", "draftclaw", "agents", "list"])).toBe("agents");
    expect(getPrimaryCommand(["node", "draftclaw"])).toBeNull();
  });

  it("parses boolean flags and ignores terminator", () => {
    expect(hasFlag(["node", "draftclaw", "status", "--json"], "--json")).toBe(true);
    expect(hasFlag(["node", "draftclaw", "--", "--json"], "--json")).toBe(false);
  });

  it("extracts flag values with equals and missing values", () => {
    expect(getFlagValue(["node", "draftclaw", "status", "--timeout", "5000"], "--timeout")).toBe(
      "5000",
    );
    expect(getFlagValue(["node", "draftclaw", "status", "--timeout=2500"], "--timeout")).toBe(
      "2500",
    );
    expect(getFlagValue(["node", "draftclaw", "status", "--timeout"], "--timeout")).toBeNull();
    expect(getFlagValue(["node", "draftclaw", "status", "--timeout", "--json"], "--timeout")).toBe(
      null,
    );
    expect(getFlagValue(["node", "draftclaw", "--", "--timeout=99"], "--timeout")).toBeUndefined();
  });

  it("parses verbose flags", () => {
    expect(getVerboseFlag(["node", "draftclaw", "status", "--verbose"])).toBe(true);
    expect(getVerboseFlag(["node", "draftclaw", "status", "--debug"])).toBe(false);
    expect(getVerboseFlag(["node", "draftclaw", "status", "--debug"], { includeDebug: true })).toBe(
      true,
    );
  });

  it("parses positive integer flag values", () => {
    expect(getPositiveIntFlagValue(["node", "draftclaw", "status"], "--timeout")).toBeUndefined();
    expect(
      getPositiveIntFlagValue(["node", "draftclaw", "status", "--timeout"], "--timeout"),
    ).toBeNull();
    expect(
      getPositiveIntFlagValue(["node", "draftclaw", "status", "--timeout", "5000"], "--timeout"),
    ).toBe(5000);
    expect(
      getPositiveIntFlagValue(["node", "draftclaw", "status", "--timeout", "nope"], "--timeout"),
    ).toBeUndefined();
  });

  it("builds parse argv from raw args", () => {
    const nodeArgv = buildParseArgv({
      programName: "draftclaw",
      rawArgs: ["node", "draftclaw", "status"],
    });
    expect(nodeArgv).toEqual(["node", "draftclaw", "status"]);

    const versionedNodeArgv = buildParseArgv({
      programName: "draftclaw",
      rawArgs: ["node-22", "draftclaw", "status"],
    });
    expect(versionedNodeArgv).toEqual(["node-22", "draftclaw", "status"]);

    const versionedNodeWindowsArgv = buildParseArgv({
      programName: "draftclaw",
      rawArgs: ["node-22.2.0.exe", "draftclaw", "status"],
    });
    expect(versionedNodeWindowsArgv).toEqual(["node-22.2.0.exe", "draftclaw", "status"]);

    const versionedNodePatchlessArgv = buildParseArgv({
      programName: "draftclaw",
      rawArgs: ["node-22.2", "draftclaw", "status"],
    });
    expect(versionedNodePatchlessArgv).toEqual(["node-22.2", "draftclaw", "status"]);

    const versionedNodeWindowsPatchlessArgv = buildParseArgv({
      programName: "draftclaw",
      rawArgs: ["node-22.2.exe", "draftclaw", "status"],
    });
    expect(versionedNodeWindowsPatchlessArgv).toEqual(["node-22.2.exe", "draftclaw", "status"]);

    const versionedNodeWithPathArgv = buildParseArgv({
      programName: "draftclaw",
      rawArgs: ["/usr/bin/node-22.2.0", "draftclaw", "status"],
    });
    expect(versionedNodeWithPathArgv).toEqual(["/usr/bin/node-22.2.0", "draftclaw", "status"]);

    const nodejsArgv = buildParseArgv({
      programName: "draftclaw",
      rawArgs: ["nodejs", "draftclaw", "status"],
    });
    expect(nodejsArgv).toEqual(["nodejs", "draftclaw", "status"]);

    const nonVersionedNodeArgv = buildParseArgv({
      programName: "draftclaw",
      rawArgs: ["node-dev", "draftclaw", "status"],
    });
    expect(nonVersionedNodeArgv).toEqual(["node", "draftclaw", "node-dev", "draftclaw", "status"]);

    const directArgv = buildParseArgv({
      programName: "draftclaw",
      rawArgs: ["draftclaw", "status"],
    });
    expect(directArgv).toEqual(["node", "draftclaw", "status"]);

    const bunArgv = buildParseArgv({
      programName: "draftclaw",
      rawArgs: ["bun", "src/entry.ts", "status"],
    });
    expect(bunArgv).toEqual(["bun", "src/entry.ts", "status"]);
  });

  it("builds parse argv from fallback args", () => {
    const fallbackArgv = buildParseArgv({
      programName: "draftclaw",
      fallbackArgv: ["status"],
    });
    expect(fallbackArgv).toEqual(["node", "draftclaw", "status"]);
  });

  it("decides when to migrate state", () => {
    expect(shouldMigrateState(["node", "draftclaw", "status"])).toBe(false);
    expect(shouldMigrateState(["node", "draftclaw", "health"])).toBe(false);
    expect(shouldMigrateState(["node", "draftclaw", "sessions"])).toBe(false);
    expect(shouldMigrateState(["node", "draftclaw", "memory", "status"])).toBe(false);
    expect(shouldMigrateState(["node", "draftclaw", "agent", "--message", "hi"])).toBe(false);
    expect(shouldMigrateState(["node", "draftclaw", "agents", "list"])).toBe(true);
    expect(shouldMigrateState(["node", "draftclaw", "message", "send"])).toBe(true);
  });

  it("reuses command path for migrate state decisions", () => {
    expect(shouldMigrateStateFromPath(["status"])).toBe(false);
    expect(shouldMigrateStateFromPath(["agents", "list"])).toBe(true);
  });
});
