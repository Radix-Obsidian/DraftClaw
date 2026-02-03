---
summary: "CLI reference for `draftclaw reset` (reset local state/config)"
read_when:
  - You want to wipe local state while keeping the CLI installed
  - You want a dry-run of what would be removed
title: "reset"
---

# `draftclaw reset`

Reset local config/state (keeps the CLI installed).

```bash
draftclaw reset
draftclaw reset --dry-run
draftclaw reset --scope config+creds+sessions --yes --non-interactive
```
