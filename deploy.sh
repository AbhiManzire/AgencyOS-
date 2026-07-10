#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${PROJECT_PATH:-/var/www/AgencyOS-}"
cd "$APP_DIR"

git fetch origin main
git reset --hard origin/main

export HUSKY=0
pnpm install --frozen-lockfile

pnpm --filter @agencyos/backend exec prisma generate
pnpm --filter @agencyos/backend exec prisma migrate deploy

pnpm run build

pm2 startOrReload ecosystem.config.js --update-env
pm2 save

echo "AgencyOS deployment completed successfully."
