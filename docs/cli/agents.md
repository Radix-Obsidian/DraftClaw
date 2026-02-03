---
summary: "CLI reference for `draftclaw agents` (list/add/delete/set identity)"
read_when:
  - You want multiple isolated agents (workspaces + routing + auth)
title: "agents"
---

# `draftclaw agents`

Manage isolated agents (workspaces + auth + routing).

Related:

- Multi-agent routing: [Multi-Agent Routing](/concepts/multi-agent)
- Agent workspace: [Agent workspace](/concepts/agent-workspace)

## Examples

```bash
draftclaw agents list
draftclaw agents add work --workspace ~/.draftclaw/workspace-work
draftclaw agents set-identity --workspace ~/.draftclaw/workspace --from-identity
draftclaw agents set-identity --agent main --avatar avatars/draftclaw.png
draftclaw agents delete work
```

## Identity files

Each agent workspace can include an `IDENTITY.md` at the workspace root:

- Example path: `~/.draftclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` reads from the workspace root (or an explicit `--identity-file`)

Avatar paths resolve relative to the workspace root.

## Set identity

`set-identity` writes fields into `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (workspace-relative path, http(s) URL, or data URI)

Load from `IDENTITY.md`:

```bash
draftclaw agents set-identity --workspace ~/.draftclaw/workspace --from-identity
```

Override fields explicitly:

```bash
draftclaw agents set-identity --agent main --name "DraftClaw" --emoji "🦞" --avatar avatars/draftclaw.png
```

Config sample:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "DraftClaw",
          theme: "space lobster",
          emoji: "🦞",
          avatar: "avatars/draftclaw.png",
        },
      },
    ],
  },
}
```
