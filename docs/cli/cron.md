---
summary: "CLI reference for `draftclaw cron` (schedule and run background jobs)"
read_when:
  - You want scheduled jobs and wakeups
  - You’re debugging cron execution and logs
title: "cron"
---

# `draftclaw cron`

Manage cron jobs for the Gateway scheduler.

Related:

- Cron jobs: [Cron jobs](/automation/cron-jobs)

Tip: run `draftclaw cron --help` for the full command surface.

## Common edits

Update delivery settings without changing the message:

```bash
draftclaw cron edit <job-id> --deliver --channel telegram --to "123456789"
```

Disable delivery for an isolated job:

```bash
draftclaw cron edit <job-id> --no-deliver
```
