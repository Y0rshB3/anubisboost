#!/usr/bin/env bash
# =============================================================================
# ssl-init.sh — Obtain initial Let's Encrypt certificate
# =============================================================================
# Run this ONCE after first deployment. Requires:
#   - DNS A record pointing to this server
#   - Ports 80/443 open
#   - .env.production with DOMAIN and SSL_EMAIL set

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

source "$PROJECT_DIR/.env.production"

if [[ -z "${DOMAIN:-}" || -z "${SSL_EMAIL:-}" ]]; then
    echo "ERROR: DOMAIN and SSL_EMAIL must be set in .env.production"
    exit 1
fi

DC="docker compose -f $PROJECT_DIR/docker-compose.prod.yml --env-file $PROJECT_DIR/.env.production"

echo "==> Step 1: Starting nginx in HTTP-only mode for ACME challenge..."

# Temporarily use a simple HTTP config that serves the ACME challenge
cat > "$PROJECT_DIR/nginx/conf.d/temp-http.conf" << TEMPEOF
server {
    listen 80;
    server_name ${DOMAIN};

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'Waiting for SSL...';
        add_header Content-Type text/plain;
    }

    location = /health {
        return 200 'ok';
        add_header Content-Type text/plain;
    }
}
TEMPEOF

# Override main nginx.conf temporarily with a minimal one
cat > "$PROJECT_DIR/nginx/nginx-temp.conf" << TEMPEOF
user nginx;
worker_processes 1;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;
events { worker_connections 256; }
http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    include /etc/nginx/conf.d/*.conf;
}
TEMPEOF

# Start only nginx with the temp config
docker compose -f "$PROJECT_DIR/docker-compose.prod.yml" --env-file "$PROJECT_DIR/.env.production" \
    run -d --name ab-nginx-temp \
    -v "$PROJECT_DIR/nginx/nginx-temp.conf:/etc/nginx/nginx.conf:ro" \
    -v "$PROJECT_DIR/nginx/conf.d:/etc/nginx/conf.d:ro" \
    -p 80:80 \
    nginx nginx -g 'daemon off;' 2>/dev/null || true

sleep 3

echo "==> Step 2: Requesting certificate from Let's Encrypt..."

docker run --rm \
    -v anubisboost-prod_certbot_webroot:/var/www/certbot \
    -v anubisboost-prod_certbot_certs:/etc/letsencrypt \
    certbot/certbot:v2.8.0 \
    certonly --webroot \
    -w /var/www/certbot \
    -d "$DOMAIN" \
    --email "$SSL_EMAIL" \
    --agree-tos \
    --no-eff-email \
    --non-interactive

echo "==> Step 3: Cleaning up temp nginx..."
docker stop ab-nginx-temp 2>/dev/null || true
docker rm ab-nginx-temp 2>/dev/null || true
rm -f "$PROJECT_DIR/nginx/conf.d/temp-http.conf"
rm -f "$PROJECT_DIR/nginx/nginx-temp.conf"

echo "==> Step 4: Preparing production nginx config..."

# Replace ${DOMAIN} placeholder in nginx.conf
sed "s/\${DOMAIN}/$DOMAIN/g" "$PROJECT_DIR/nginx/nginx.conf" > "$PROJECT_DIR/nginx/nginx-resolved.conf"

echo ""
echo "============================================"
echo "SSL certificate obtained successfully!"
echo "============================================"
echo ""
echo "Now start the full stack:"
echo "  make prod-up"
echo ""
echo "NOTE: The nginx.conf still has \${DOMAIN} placeholders."
echo "      The deploy script handles substitution automatically."
