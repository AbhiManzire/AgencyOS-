#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <backup-file.sql.gz>"
  exit 1
fi

BACKUP_FILE="$1"

POSTGRES_USER="${POSTGRES_USER:-agencyos}"
POSTGRES_DB="${POSTGRES_DB:-agencyos}"
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"

if [[ ! -f "${BACKUP_FILE}" ]]; then
  echo "Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

echo "Restoring ${BACKUP_FILE} into ${POSTGRES_DB}@${POSTGRES_HOST}:${POSTGRES_PORT}"
gunzip -c "${BACKUP_FILE}" | PGPASSWORD="${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}" \
  psql \
    -h "${POSTGRES_HOST}" \
    -p "${POSTGRES_PORT}" \
    -U "${POSTGRES_USER}" \
    -d "${POSTGRES_DB}"

echo "Restore complete"
