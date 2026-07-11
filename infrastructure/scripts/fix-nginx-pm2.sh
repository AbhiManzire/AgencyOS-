#!/usr/bin/env bash
# Run ON the VPS as root (or with sudo).
# Diagnoses PM2 ports vs Nginx upstreams and applies the PM2 nginx site config.
set -euo pipefail

APP_DIR="${PROJECT_PATH:-/var/www/AgencyOS-}"
SITE_SRC="${APP_DIR}/infrastructure/nginx/agencyos.vps.conf"
SITE_DST="/etc/nginx/sites-available/agencyos"
SITE_LINK="/etc/nginx/sites-enabled/agencyos"

echo "=== PM2 status ==="
pm2 list || true
pm2 describe agencyos-backend 2>/dev/null | sed -n '1,80p' || true
pm2 describe agencyos-frontend 2>/dev/null | sed -n '1,80p' || true

echo
echo "=== Listening ports (3000 / 3001) ==="
ss -ltnp | grep -E ':3000|:3001' || true

echo
echo "=== Local curls ==="
curl -sS -o /dev/null -w "frontend :3000 -> %{http_code}\n" http://127.0.0.1:3000/ || true
curl -sS -o /dev/null -w "backend  :3001/api/health/live -> %{http_code}\n" http://127.0.0.1:3001/api/health/live || true
curl -sS -o /dev/null -w "backend  :3001/api/dashboard/summary -> %{http_code}\n" http://127.0.0.1:3001/api/dashboard/summary || true

echo
echo "=== Current nginx site ==="
if [[ -f "$SITE_LINK" || -L "$SITE_LINK" ]]; then
  ls -la "$SITE_LINK"
  echo "-----"
  cat "$SITE_LINK"
else
  echo "MISSING: $SITE_LINK"
fi

echo
echo "=== Recent nginx error log (proxy) ==="
sudo tail -n 40 /var/log/nginx/error.log 2>/dev/null || tail -n 40 /var/log/nginx/error.log || true

if [[ ! -f "$SITE_SRC" ]]; then
  echo "ERROR: site template not found at $SITE_SRC"
  echo "Pull latest main into $APP_DIR first."
  exit 1
fi

echo
echo "=== Ensure backend is up on 3001 ==="
if ! curl -sf http://127.0.0.1:3001/api/health/live >/dev/null; then
  echo "Backend not healthy on 127.0.0.1:3001 — restarting PM2 apps"
  cd "$APP_DIR"
  pm2 startOrReload ecosystem.config.js --update-env
  pm2 save
  sleep 2
  curl -sS -o /dev/null -w "backend after reload -> %{http_code}\n" http://127.0.0.1:3001/api/health/live || true
fi

echo
echo "=== Install nginx site (preserve existing SSL cert paths if present) ==="
# If an existing site already has working ssl_certificate lines, keep those paths.
if [[ -f "$SITE_DST" ]] || [[ -L "$SITE_LINK" ]]; then
  EXISTING="${SITE_DST}"
  [[ -L "$SITE_LINK" ]] && EXISTING="$(readlink -f "$SITE_LINK" || true)"
  if [[ -f "${EXISTING:-}" ]]; then
    CERT_LINE=$(grep -E '^\s*ssl_certificate\s+' "$EXISTING" | head -1 || true)
    KEY_LINE=$(grep -E '^\s*ssl_certificate_key\s+' "$EXISTING" | head -1 || true)
  fi
fi

sudo cp "$SITE_SRC" "$SITE_DST"

if [[ -n "${CERT_LINE:-}" && -n "${KEY_LINE:-}" ]]; then
  # Replace default cert paths with the live ones already on this host
  CERT_PATH=$(echo "$CERT_LINE" | awk '{print $2}' | tr -d ';')
  KEY_PATH=$(echo "$KEY_LINE" | awk '{print $2}' | tr -d ';')
  sudo sed -i "s|/etc/letsencrypt/live/damsole.in/fullchain.pem|${CERT_PATH}|g" "$SITE_DST"
  sudo sed -i "s|/etc/letsencrypt/live/damsole.in/privkey.pem|${KEY_PATH}|g" "$SITE_DST"
fi

sudo ln -sfn "$SITE_DST" "$SITE_LINK"
sudo nginx -t
sudo systemctl reload nginx

echo
echo "=== Public verification ==="
curl -sS -o /dev/null -w "https://damsole.in/ -> %{http_code}\n" https://damsole.in/ || true
curl -sS -o /dev/null -w "https://damsole.in/api/health/live -> %{http_code}\n" https://damsole.in/api/health/live || true
curl -sS -o /dev/null -w "https://damsole.in/api/dashboard/summary -> %{http_code}\n" \
  -H "x-tenant-id: 00000000-0000-4000-8000-000000000001" \
  -H "x-workspace-id: 00000000-0000-4000-8000-000000000002" \
  https://damsole.in/api/dashboard/summary || true

echo
echo "Done. If API still 502, check: pm2 logs agencyos-backend --lines 100"
