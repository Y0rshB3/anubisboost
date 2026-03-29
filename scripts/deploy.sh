#!/usr/bin/env bash
# =============================================================================
# deploy.sh — Deploy or update AnubisBoost in production
# =============================================================================
# Usage: ./scripts/deploy.sh [--first-run]
#
# --first-run: Use on initial deployment. Runs SSL init and full setup.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DC="docker compose -f $PROJECT_DIR/docker-compose.prod.yml --env-file $PROJECT_DIR/.env.production"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[deploy]${NC} $1"; }
warn() { echo -e "${YELLOW}[warn]${NC} $1"; }
err() { echo -e "${RED}[error]${NC} $1" >&2; }

# -------------------------------------------------------------------------
# Pre-flight checks
# -------------------------------------------------------------------------
if [[ ! -f "$PROJECT_DIR/.env.production" ]]; then
    err ".env.production not found. Copy .env.example and configure it."
    exit 1
fi

source "$PROJECT_DIR/.env.production"

for var in DOMAIN SSL_EMAIL MYSQL_PASSWORD MYSQL_ROOT_PASSWORD SESSION_SECRET; do
    if [[ -z "${!var:-}" ]]; then
        err "Required variable $var is not set in .env.production"
        exit 1
    fi
done

# Check for default/weak secrets
if [[ "${MYSQL_PASSWORD}" == "changeme"* ]]; then
    err "MYSQL_PASSWORD is still set to the default. Change it."
    exit 1
fi

# -------------------------------------------------------------------------
# Resolve DOMAIN in nginx.conf
# -------------------------------------------------------------------------
log "Resolving nginx.conf with DOMAIN=$DOMAIN..."
sed "s/\${DOMAIN}/$DOMAIN/g" "$PROJECT_DIR/nginx/nginx.conf" > "$PROJECT_DIR/nginx/nginx-resolved.conf"

# Use the resolved config
if [[ -f "$PROJECT_DIR/nginx/nginx-resolved.conf" ]]; then
    cp "$PROJECT_DIR/nginx/nginx-resolved.conf" "$PROJECT_DIR/nginx/nginx-active.conf"
fi

# -------------------------------------------------------------------------
# First run — SSL setup
# -------------------------------------------------------------------------
if [[ "${1:-}" == "--first-run" ]]; then
    log "First-run mode: initializing SSL..."
    "$SCRIPT_DIR/ssl-init.sh"
fi

# -------------------------------------------------------------------------
# Backup existing database (if running)
# -------------------------------------------------------------------------
if docker ps --format '{{.Names}}' | grep -q ab-mysql; then
    log "Backing up database before deploy..."
    "$SCRIPT_DIR/backup-db.sh" || warn "Backup failed — continuing deploy anyway."
fi

# -------------------------------------------------------------------------
# Build and deploy
# -------------------------------------------------------------------------
log "Pulling base images..."
$DC pull mysql redis nginx certbot 2>/dev/null || true

log "Building application images..."
$DC build --parallel

log "Starting services..."
$DC up -d

# Wait for health checks
log "Waiting for services to be healthy..."
sleep 10

for service in api nginx; do
    status=$($DC ps --format json "$service" 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('Health','unknown'))" 2>/dev/null || echo "unknown")
    if [[ "$status" == "healthy" ]]; then
        log "$service: healthy"
    else
        warn "$service status: $status (may still be starting)"
    fi
done

# -------------------------------------------------------------------------
# Summary
# -------------------------------------------------------------------------
echo ""
echo "============================================"
log "Deployment complete!"
echo "============================================"
$DC ps
echo ""
log "Application: https://$DOMAIN"
log "Health check: https://$DOMAIN/health"
