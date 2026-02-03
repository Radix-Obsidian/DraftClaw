---
summary: "CLI reference for `draftclaw config` (get/set/unset config values)"
read_when:
  - You want to read or edit config non-interactively
title: "config"
---

# `draftclaw config`

Config helpers: get/set/unset values by path. Run without a subcommand to open
the configure wizard (same as `draftclaw configure`).

## Examples

```bash
draftclaw config get browser.executablePath
draftclaw config set browser.executablePath "/usr/bin/google-chrome"
draftclaw config set agents.defaults.heartbeat.every "2h"
draftclaw config set agents.list[0].tools.exec.node "node-id-or-name"
draftclaw config unset tools.web.search.apiKey
```

## Paths

Paths use dot or bracket notation:

```bash
draftclaw config get agents.defaults.workspace
draftclaw config get agents.list[0].id
```

Use the agent list index to target a specific agent:

```bash
draftclaw config get agents.list
draftclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Values

Values are parsed as JSON5 when possible; otherwise they are treated as strings.
Use `--json` to require JSON5 parsing.

```bash
draftclaw config set agents.defaults.heartbeat.every "0m"
draftclaw config set gateway.port 19001 --json
draftclaw config set channels.whatsapp.groups '["*"]' --json
```

Restart the gateway after edits.
