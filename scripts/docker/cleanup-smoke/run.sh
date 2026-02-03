#!/usr/bin/env bash
set -euo pipefail

cd /repo

export DRAFTCLAW_STATE_DIR="/tmp/draftclaw-test"
export DRAFTCLAW_CONFIG_PATH="${DRAFTCLAW_STATE_DIR}/draftclaw.json"

echo "==> Build"
pnpm build

echo "==> Seed state"
mkdir -p "${DRAFTCLAW_STATE_DIR}/credentials"
mkdir -p "${DRAFTCLAW_STATE_DIR}/agents/main/sessions"
echo '{}' >"${DRAFTCLAW_CONFIG_PATH}"
echo 'creds' >"${DRAFTCLAW_STATE_DIR}/credentials/marker.txt"
echo 'session' >"${DRAFTCLAW_STATE_DIR}/agents/main/sessions/sessions.json"

echo "==> Reset (config+creds+sessions)"
pnpm draftclaw reset --scope config+creds+sessions --yes --non-interactive

test ! -f "${DRAFTCLAW_CONFIG_PATH}"
test ! -d "${DRAFTCLAW_STATE_DIR}/credentials"
test ! -d "${DRAFTCLAW_STATE_DIR}/agents/main/sessions"

echo "==> Recreate minimal config"
mkdir -p "${DRAFTCLAW_STATE_DIR}/credentials"
echo '{}' >"${DRAFTCLAW_CONFIG_PATH}"

echo "==> Uninstall (state only)"
pnpm draftclaw uninstall --state --yes --non-interactive

test ! -d "${DRAFTCLAW_STATE_DIR}"

echo "OK"
