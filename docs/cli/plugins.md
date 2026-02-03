---
summary: "CLI reference for `draftclaw plugins` (list, install, enable/disable, doctor)"
read_when:
  - You want to install or manage in-process Gateway plugins
  - You want to debug plugin load failures
title: "plugins"
---

# `draftclaw plugins`

Manage Gateway plugins/extensions (loaded in-process).

Related:

- Plugin system: [Plugins](/plugin)
- Plugin manifest + schema: [Plugin manifest](/plugins/manifest)
- Security hardening: [Security](/gateway/security)

## Commands

```bash
draftclaw plugins list
draftclaw plugins info <id>
draftclaw plugins enable <id>
draftclaw plugins disable <id>
draftclaw plugins doctor
draftclaw plugins update <id>
draftclaw plugins update --all
```

Bundled plugins ship with DraftClaw but start disabled. Use `plugins enable` to
activate them.

All plugins must ship a `draftclaw.plugin.json` file with an inline JSON Schema
(`configSchema`, even if empty). Missing/invalid manifests or schemas prevent
the plugin from loading and fail config validation.

### Install

```bash
draftclaw plugins install <path-or-spec>
```

Security note: treat plugin installs like running code. Prefer pinned versions.

Supported archives: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Use `--link` to avoid copying a local directory (adds to `plugins.load.paths`):

```bash
draftclaw plugins install -l ./my-plugin
```

### Update

```bash
draftclaw plugins update <id>
draftclaw plugins update --all
draftclaw plugins update <id> --dry-run
```

Updates only apply to plugins installed from npm (tracked in `plugins.installs`).
