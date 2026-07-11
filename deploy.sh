#!/usr/bin/env bash
# Idempotent AgencyOS VPS deploy. Safe to re-run; always converges to repo state.
set -euo pipefail

APP_DIR="${PROJECT_PATH:-/var/www/AgencyOS-}"
SITE_SRC="${APP_DIR}/infrastructure/nginx/agencyos.vps.conf"
SITE_DST="/etc/nginx/sites-available/agencyos"
SITE_LINK="/etc/nginx/sites-enabled/agencyos"
DEFAULT_SITE="/etc/nginx/sites-enabled/default"
HEALTH_URL="http://127.0.0.1:3001/api/health/live"
HEALTH_RETRIES="${HEALTH_RETRIES:-30}"
HEALTH_SLEEP_SEC="${HEALTH_SLEEP_SEC:-2}"

run_root() {
  if [[ "$(id -u)" -eq 0 ]]; then
    "$@"
  else
    sudo "$@"
  fi
}

# Re-exec after pull so this run always uses the latest deploy.sh from main.
if [[ "${1:-}" != "--post-pull" ]]; then
  cd "$APP_DIR"
  echo "==> Syncing repository to origin/main"
  git fetch origin main
  git reset --hard origin/main
  exec bash "$APP_DIR/deploy.sh" --post-pull
fi

cd "$APP_DIR"

echo "==> Installing dependencies"
export HUSKY=0
pnpm install --frozen-lockfile

echo "==> Prisma generate"
pnpm --filter @agencyos/backend exec prisma generate

echo "==> Prisma migrate deploy"
pnpm --filter @agencyos/backend exec prisma migrate deploy

echo "==> Building shared, backend, and frontend"
pnpm run build

echo "==> Restarting PM2 with ecosystem.config.js env (PORT=3001 backend, PORT=3000 frontend)"
# Delete+start so stale PM2 dump/env (wrong PORT/script) cannot survive reload.
pm2 delete agencyos-backend agencyos-frontend 2>/dev/null || true
pm2 start ecosystem.config.js --update-env
pm2 save

# Ensure processes resurrect after reboot (idempotent when already configured).
PM2_STARTUP_LINE="$(pm2 startup systemd -u "$(whoami)" --hp "$HOME" 2>/dev/null | tail -n 1 || true)"
if [[ -n "${PM2_STARTUP_LINE}" && "${PM2_STARTUP_LINE}" == sudo* ]]; then
  echo "==> Configuring PM2 systemd startup"
  # shellcheck disable=SC2086
  eval "${PM2_STARTUP_LINE}" || true
  pm2 save
fi

echo "==> Installing nginx site from repository"
if [[ ! -f "$SITE_SRC" ]]; then
  echo "ERROR: nginx site template missing at $SITE_SRC" >&2
  exit 1
fi

# Preserve live SSL certificate paths if an existing site already has them.
CERT_LINE=""
KEY_LINE=""
if [[ -f "$SITE_DST" ]] || [[ -L "$SITE_LINK" ]]; then
  EXISTING="$SITE_DST"
  if [[ -L "$SITE_LINK" ]]; then
    EXISTING="$(readlink -f "$SITE_LINK" || true)"
  fi
  if [[ -f "${EXISTING:-}" ]]; then
    CERT_LINE="$(grep -E '^\s*ssl_certificate\s+' "$EXISTING" | head -1 || true)"
    KEY_LINE="$(grep -E '^\s*ssl_certificate_key\s+' "$EXISTING" | head -1 || true)"
  fi
fi

run_root cp "$SITE_SRC" "$SITE_DST"

if [[ -n "${CERT_LINE}" && -n "${KEY_LINE}" ]]; then
  CERT_PATH="$(echo "$CERT_LINE" | awk '{print $2}' | tr -d ';')"
  KEY_PATH="$(echo "$KEY_LINE" | awk '{print $2}' | tr -d ';')"
  run_root sed -i "s|/etc/letsencrypt/live/damsole.in/fullchain.pem|${CERT_PATH}|g" "$SITE_DST"
  run_root sed -i "s|/etc/letsencrypt/live/damsole.in/privkey.pem|${KEY_PATH}|g" "$SITE_DST"
fi

run_root ln -sfn "$SITE_DST" "$SITE_LINK"

if [[ -e "$DEFAULT_SITE" || -L "$DEFAULT_SITE" ]]; then
  echo "==> Removing conflicting nginx default site"
  run_root rm -f "$DEFAULT_SITE"
fi

echo "==> Validating and reloading nginx"
run_root nginx -t
run_root systemctl reload nginx

echo "==> Waiting for backend health at ${HEALTH_URL}"
healthy=0
for ((i = 1; i <= HEALTH_RETRIES; i++)); do
  if curl -sf "$HEALTH_URL" >/dev/null; then
    healthy=1
    break
  fi
  sleep "$HEALTH_SLEEP_SEC"
done

if [[ "$healthy" -ne 1 ]]; then
  echo "ERROR: Health check failed after ${HEALTH_RETRIES} attempts: ${HEALTH_URL}" >&2
  echo "Inspect with: pm2 logs agencyos-backend --lines 100" >&2
  exit 1
fi

echo "AgencyOS deployment completed successfully."
echo "Health OK: ${HEALTH_URL}"
