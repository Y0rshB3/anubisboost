# =============================================================================
# AnubisBoost Backend — Multi-stage Dockerfile
# =============================================================================
# Stages:
#   1. base        — shared Node.js runtime
#   2. deps        — install production dependencies
#   3. development — dev server with hot reload (nodemon)
#   4. build       — (reserved for TypeScript projects)
#   5. production  — minimal production image

# ---------------------------------------------------------------------------
# Stage 1: Base
# ---------------------------------------------------------------------------
FROM node:20-alpine AS base

RUN apk add --no-cache tini curl
WORKDIR /app

# ---------------------------------------------------------------------------
# Stage 2: Dependencies
# ---------------------------------------------------------------------------
FROM base AS deps

COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts && npm cache clean --force

# ---------------------------------------------------------------------------
# Stage 3: Development
# ---------------------------------------------------------------------------
FROM base AS development

# Install nodemon globally for hot reload
RUN npm install -g nodemon@3.1.0

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./

# Source code is bind-mounted in docker-compose.yml, not copied here.
# This keeps the image small and enables hot reload.

EXPOSE 3000

# Use tini as init to handle signals properly
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["nodemon", "--watch", "src", "--ext", "js,json", "src/index.js"]

# ---------------------------------------------------------------------------
# Stage 4: Production
# ---------------------------------------------------------------------------
FROM base AS production

# Run as non-root
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
COPY migrations ./migrations
RUN mkdir -p /app/uploads && chown appuser:appgroup /app/uploads
COPY seeds ./seeds

# Remove dev dependencies that might have leaked
RUN npm prune --production 2>/dev/null; exit 0

USER appuser

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/index.js"]
