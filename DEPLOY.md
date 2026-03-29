# AnubisBoost — Production Deployment Guide

## Deployment Options Overview

| Option | Cost | Pros | Cons |
|--------|------|------|------|
| **A: Hostinger VPS** | $4-10/mo | Full control, persistent, all services in one place | Manual setup, you manage updates |
| **B: Railway/Render** | $0-7/mo | Managed, easy deploys | Free tiers are limited, may sleep |
| **C: Vercel + VPS** | $0-5/mo | Free frontend CDN, fast globally | Split architecture, more complex |

---

## Option A: Hostinger VPS (Recommended)

This is the most straightforward and cost-effective approach for a full-stack app
with WebSockets. You get a real server for $4-10/month.

### 1. Order and access the VPS

1. Order a Hostinger VPS (KVM 1 or KVM 2, Ubuntu 22.04/24.04).
2. Note down the IP address.
3. SSH in: `ssh root@YOUR_SERVER_IP`

### 2. Initial server setup (run as root)

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose plugin
apt install -y docker-compose-plugin

# Create a deploy user (never run the app as root)
adduser --disabled-password deploy
usermod -aG docker deploy

# Set up SSH key for the deploy user
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# Basic firewall
apt install -y ufw
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable

# Install fail2ban
apt install -y fail2ban
systemctl enable fail2ban

# Optional: change SSH port (edit /etc/ssh/sshd_config, then ufw allow NEW_PORT)
```

From now on, SSH as the `deploy` user: `ssh deploy@YOUR_SERVER_IP`

### 3. Deploy the application

```bash
# On the server, as the deploy user
cd /home/deploy
git clone https://github.com/YOUR_USERNAME/anubisboost.git
cd anubisboost

# Create production environment file
cp .env.example .env.production
```

Edit `.env.production` with real values:

```bash
nano .env.production
```

Required changes:
- `NODE_ENV=production`
- `DOMAIN=yourdomain.com`
- `SSL_EMAIL=you@example.com`
- `MYSQL_PASSWORD=` (generate: `openssl rand -hex 32`)
- `MYSQL_ROOT_PASSWORD=` (generate: `openssl rand -hex 32`)
- `REDIS_PASSWORD=` (generate: `openssl rand -hex 32`)
- `SESSION_SECRET=` (generate: `openssl rand -hex 32`)
- `JWT_SECRET=` (generate: `openssl rand -hex 32`)

### 4. Set up DNS

Point your domain's A record to the server IP address.
Wait for DNS propagation (check with `dig yourdomain.com`).

### 5. First deployment

```bash
# Initialize SSL and start everything
./scripts/deploy.sh --first-run
```

### 6. Verify

```bash
# Check all services
make prod-ps

# Check health
curl https://yourdomain.com/health

# Check logs
make prod-logs
```

### 7. Set up automated backups

```bash
# Add to crontab (daily at 3 AM)
crontab -e
# Add this line:
0 3 * * * /home/deploy/anubisboost/scripts/backup-db.sh >> /home/deploy/anubisboost/backups/cron.log 2>&1
```

### 8. Subsequent deploys (updates)

```bash
cd /home/deploy/anubisboost
git pull origin main
./scripts/deploy.sh
```

### 9. Rollback

If a deploy goes wrong:

```bash
# See recent commits
git log --oneline -10

# Roll back to a specific commit
git checkout COMMIT_HASH

# Rebuild and restart
make prod-build
make prod-up
```

---

## Option B: Railway / Render

### Railway

1. Connect your GitHub repo to Railway.
2. Railway auto-detects Dockerfiles. Create two services:
   - **Backend**: point to `backend/Dockerfile`, set target to `production`.
   - **Frontend**: point to `frontend/Dockerfile`, set target to `production`.
3. Add a MySQL plugin and a Redis plugin from Railway's marketplace.
4. Set environment variables in Railway's dashboard (same as `.env.production`).
5. Railway provides a domain or you can add a custom one.

**Limitations**: Free tier gives $5 credit/month, WebSocket connections may
have timeouts on some plans.

### Render

1. Create a "Web Service" for the backend (Docker, `backend/Dockerfile`).
2. Create a "Static Site" for the frontend (`npm run build`, publish `dist/`).
3. Add Render's managed MySQL (or use PlanetScale free tier) and Redis.
4. Set environment variables in the Render dashboard.

**Limitations**: Free tier services sleep after 15 minutes of inactivity.
WebSocket support exists but has a 5-minute idle timeout on free tier.

---

## Option C: Vercel (frontend) + Separate Backend

Best if your frontend gets heavy traffic and the backend is lightweight.

### Frontend on Vercel

1. Connect the `frontend/` directory to Vercel.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Environment variables: `VITE_API_URL=https://api.yourdomain.com/api`

### Backend on Hostinger VPS (or Railway)

Follow Option A for the backend only. Skip the frontend build service and
the nginx static file serving; Vercel handles that.

Update nginx.conf to only proxy `/api` and `/socket.io`, remove the SPA
fallback block.

**Limitations**: CORS configuration becomes more important. WebSocket
connections go directly to the backend server, not through Vercel.

---

## Resource Requirements

Minimum VPS specs for AnubisBoost:

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU      | 1 vCPU  | 2 vCPU      |
| RAM      | 1 GB    | 2 GB        |
| Disk     | 10 GB   | 20 GB       |

With the resource limits set in `docker-compose.prod.yml`:
- API: max 512MB RAM, 0.5 CPU
- MySQL: max 512MB RAM, 0.5 CPU
- Redis: max 192MB RAM, 0.25 CPU
- Nginx: minimal (~20MB)

Total: approximately 1.2 GB RAM under load.

---

## Monitoring

### Basic monitoring (no extra cost)

```bash
# Container resource usage
docker stats

# Application health
curl https://yourdomain.com/api/status

# Disk usage
df -h

# Check logs for errors
docker compose -f docker-compose.prod.yml logs --since 1h | grep -i error
```

### Optional: set up a simple uptime check

Use a free service like UptimeRobot or Healthchecks.io to ping
`https://yourdomain.com/health` every 5 minutes and alert you if it goes down.
