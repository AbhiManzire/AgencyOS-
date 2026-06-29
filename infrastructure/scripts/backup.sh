#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUTPUT_FILE="${BACKUP_DIR}/agencyos-${TIMESTAMP}.sql.gz"

POSTGRES_USER="${POSTGRES_USER:-agencyos}"
POSTGRES_DB="${POSTGRES_DB:-agencyos}"
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"

mkdir -p "${BACKUP_DIR}"

echo "Creating backup: ${OUTPUT_FILE}"
PGPASSWORD="${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}" \
  pg_dump \
    -h "${POSTGRES_HOST}" \
    -p "${POSTGRES_PORT}" \
    -U "${POSTGRES_USER}" \
    -d "${POSTGRES_DB}" \
    --no-owner \
    --no-privileges \
  | gzip > "${OUTPUT_FILE}"

echo "Backup complete: ${OUTPUT_FILE}"
