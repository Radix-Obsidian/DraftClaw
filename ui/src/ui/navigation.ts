import type { IconName } from "./icons.js";

export const TAB_GROUPS = [
  { label: "Picks", tabs: ["daily-sheet", "nba", "ufc", "soccer"] },
  { label: "Results", tabs: ["results"] },
] as const;

export type Tab =
  | "daily-sheet"
  | "nba"
  | "ufc"
  | "soccer"
  | "results";

const TAB_PATHS: Record<Tab, string> = {
  "daily-sheet": "/",
  nba: "/nba",
  ufc: "/ufc",
  soccer: "/soccer",
  results: "/results",
};

const PATH_TO_TAB = new Map(Object.entries(TAB_PATHS).map(([tab, path]) => [path, tab as Tab]));

export function normalizeBasePath(basePath: string): string {
  if (!basePath) {
    return "";
  }
  let base = basePath.trim();
  if (!base.startsWith("/")) {
    base = `/${base}`;
  }
  if (base === "/") {
    return "";
  }
  if (base.endsWith("/")) {
    base = base.slice(0, -1);
  }
  return base;
}

export function normalizePath(path: string): string {
  if (!path) {
    return "/";
  }
  let normalized = path.trim();
  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }
  if (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
}

export function pathForTab(tab: Tab, basePath = ""): string {
  const base = normalizeBasePath(basePath);
  const path = TAB_PATHS[tab];
  return base ? `${base}${path}` : path;
}

export function tabFromPath(pathname: string, basePath = ""): Tab | null {
  const base = normalizeBasePath(basePath);
  let path = pathname || "/";
  if (base) {
    if (path === base) {
      path = "/";
    } else if (path.startsWith(`${base}/`)) {
      path = path.slice(base.length);
    }
  }
  let normalized = normalizePath(path).toLowerCase();
  if (normalized.endsWith("/index.html")) {
    normalized = "/";
  }
  if (normalized === "/") {
    return "daily-sheet";
  }
  return PATH_TO_TAB.get(normalized) ?? null;
}

export function inferBasePathFromPathname(pathname: string): string {
  let normalized = normalizePath(pathname);
  if (normalized.endsWith("/index.html")) {
    normalized = normalizePath(normalized.slice(0, -"/index.html".length));
  }
  if (normalized === "/") {
    return "";
  }
  const segments = normalized.split("/").filter(Boolean);
  if (segments.length === 0) {
    return "";
  }
  for (let i = 0; i < segments.length; i++) {
    const candidate = `/${segments.slice(i).join("/")}`.toLowerCase();
    if (PATH_TO_TAB.has(candidate)) {
      const prefix = segments.slice(0, i);
      return prefix.length ? `/${prefix.join("/")}` : "";
    }
  }
  return `/${segments.join("/")}`;
}

export function iconForTab(tab: Tab): IconName {
  switch (tab) {
    case "daily-sheet":
      return "zap";
    case "nba":
      return "radio";
    case "ufc":
      return "loader";
    case "soccer":
      return "globe";
    case "results":
      return "barChart";
    default:
      return "folder";
  }
}

export function titleForTab(tab: Tab) {
  switch (tab) {
    case "daily-sheet":
      return "Daily Sheet";
    case "nba":
      return "NBA";
    case "ufc":
      return "UFC";
    case "soccer":
      return "Soccer";
    case "results":
      return "Results";
    default:
      return "DraftClaw";
  }
}

export function subtitleForTab(tab: Tab) {
  switch (tab) {
    case "daily-sheet":
      return "Tonight's top picks across all sports";
    case "nba":
      return "NBA picks, spreads, and totals";
    case "ufc":
      return "UFC fight card picks and props";
    case "soccer":
      return "EPL, Champions League & top leagues";
    case "results":
      return "Track your wins, losses, and ROI";
    default:
      return "";
  }
}
