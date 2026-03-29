# =============================================================================
# AnubisBoost Frontend — Multi-stage Dockerfile
# =============================================================================
# Stages:
#   1. base        — shared Node.js runtime
#   2. deps        — install dependencies
#   3. development — Vite dev server with HMR
#   4. build       — production build
#   5. production  — static files served by nginx

# ---------------------------------------------------------------------------
# Stage 1: Base
# ---------------------------------------------------------------------------
FROM node:20-alpine AS base

WORKDIR /app

# ---------------------------------------------------------------------------
# Stage 2: Dependencies
# ---------------------------------------------------------------------------
FROM base AS deps

COPY package.json package-lock.json* ./
RUN npm ci && npm cache clean --force

# ---------------------------------------------------------------------------
# Stage 3: Development
# ---------------------------------------------------------------------------
FROM base AS development

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./

# Source code is bind-mounted via docker-compose.yml
EXPOSE 5173

CMD ["npx", "vite", "--host", "0.0.0.0", "--port", "5173"]

# ---------------------------------------------------------------------------
# Stage 4: Build
# ---------------------------------------------------------------------------
FROM base AS build

ARG VITE_API_URL=/api
ARG VITE_WS_URL=

ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_WS_URL=${VITE_WS_URL}

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 5: Production — tiny nginx image serving static files
# ---------------------------------------------------------------------------
FROM nginx:1.25-alpine AS production

RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/dist /usr/share/nginx/html

# This default config is overridden by the host nginx in docker-compose.prod.yml.
# It exists so the image can also run standalone.
COPY nginx.conf /etc/nginx/templates/default.conf.template

ENV PORT=80

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
