#!/usr/bin/env bash
# =============================================================================
# backup-db.sh — Backup MySQL database
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_DIR/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

source "$PROJECT_DIR/.env.production" 2>/dev/null || source "$PROJECT_DIR/.env"

mkdir -p "$BACKUP_DIR"

BACKUP_FILE="$BACKUP_DIR/${MYSQL_DATABASE}_${TIMESTAMP}.sql.gz"

echo "Backing up ${MYSQL_DATABASE} to ${BACKUP_FILE}..."

docker exec ab-mysql mysqldump \
    -u"${MYSQL_USER}" \
    -p"${MYSQL_PASSWORD}" \
    --single-transaction \
    --routines \
    --triggers \
    "${MYSQL_DATABASE}" | gzip > "$BACKUP_FILE"

echo "Backup complete: ${BACKUP_FILE} ($(du -h "$BACKUP_FILE" | cut -f1))"

# Keep only last 7 backups
cd "$BACKUP_DIR" && ls -t *.sql.gz 2>/dev/null | tail -n +8 | xargs -r rm --
echo "Old backups pruned (keeping last 7)."
