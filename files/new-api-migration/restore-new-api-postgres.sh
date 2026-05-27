#!/usr/bin/env bash
set -euo pipefail

# Run this script on the US server.
# It overwrites the target PostgreSQL database with /home/ubuntu/new-api.dump.

PROJECT_DIR="${PROJECT_DIR:-/opt/new-api}"
DUMP_FILE="${DUMP_FILE:-/home/ubuntu/new-api.dump}"

APP_SERVICE="${APP_SERVICE:-new-api}"
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-postgres}"

DB_NAME="${DB_NAME:-new-api}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-123456}"

BACKUP_FILE="${BACKUP_FILE:-${PROJECT_DIR}/new-api-us-before-overwrite-$(date +%Y%m%d-%H%M%S).dump}"

echo "Project dir:          ${PROJECT_DIR}"
echo "Dump file:            ${DUMP_FILE}"
echo "Backup file:          ${BACKUP_FILE}"
echo "App service:          ${APP_SERVICE}"
echo "Postgres container:   ${POSTGRES_CONTAINER}"
echo "Database:             ${DB_NAME}"
echo "Database user:        ${DB_USER}"
echo

if [[ ! -d "${PROJECT_DIR}" ]]; then
  echo "ERROR: project directory does not exist: ${PROJECT_DIR}" >&2
  exit 1
fi

if [[ ! -f "${DUMP_FILE}" ]]; then
  echo "ERROR: dump file does not exist: ${DUMP_FILE}" >&2
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: docker command not found" >&2
  exit 1
fi

if ! docker inspect "${POSTGRES_CONTAINER}" >/dev/null 2>&1; then
  echo "ERROR: postgres container not found: ${POSTGRES_CONTAINER}" >&2
  exit 1
fi

cd "${PROJECT_DIR}"

echo "This will overwrite database '${DB_NAME}' in container '${POSTGRES_CONTAINER}'."
echo "Type OVERWRITE to continue:"
read -r CONFIRM

if [[ "${CONFIRM}" != "OVERWRITE" ]]; then
  echo "Cancelled."
  exit 1
fi

echo
echo "Stopping app service if it exists..."
if docker compose ps --services 2>/dev/null | grep -qx "${APP_SERVICE}"; then
  docker compose stop "${APP_SERVICE}"
else
  echo "WARN: compose service '${APP_SERVICE}' not found, skipping."
fi

echo
echo "Backing up current US database..."
docker exec -e PGPASSWORD="${DB_PASSWORD}" -t "${POSTGRES_CONTAINER}" \
  pg_dump -U "${DB_USER}" -d "${DB_NAME}" -Fc > "${BACKUP_FILE}"
ls -lh "${BACKUP_FILE}"

echo
echo "Dropping and recreating target database..."
docker exec -e PGPASSWORD="${DB_PASSWORD}" -i "${POSTGRES_CONTAINER}" \
  psql -v ON_ERROR_STOP=1 -U "${DB_USER}" -d postgres <<SQL
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();

DROP DATABASE IF EXISTS "${DB_NAME}";
CREATE DATABASE "${DB_NAME}" OWNER "${DB_USER}";
SQL

echo
echo "Restoring NAS dump..."
docker exec -e PGPASSWORD="${DB_PASSWORD}" -i "${POSTGRES_CONTAINER}" \
  pg_restore -U "${DB_USER}" -d "${DB_NAME}" --no-owner --role="${DB_USER}" < "${DUMP_FILE}"

echo
echo "Starting services..."
docker compose up -d

echo
echo "Tables in restored database:"
docker exec -e PGPASSWORD="${DB_PASSWORD}" -i "${POSTGRES_CONTAINER}" \
  psql -U "${DB_USER}" -d "${DB_NAME}" -c '\dt'

echo
echo "Done. Check application logs with:"
echo "  cd ${PROJECT_DIR} && docker compose logs -f ${APP_SERVICE}"
