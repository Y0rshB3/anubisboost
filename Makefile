# =============================================================================
# AnubisBoost — Makefile
# =============================================================================
# Common commands for development and deployment.

SHELL := /bin/bash
.DEFAULT_GOAL := help

# Dev compose
DC := docker compose
# Prod compose
DC_PROD := docker compose -f docker-compose.prod.yml --env-file .env.production

# ---------------------------------------------------------------------------
# Development
# ---------------------------------------------------------------------------

.PHONY: dev
dev: ## Start all development services
	cp -n .env.example .env 2>/dev/null || true
	$(DC) up --build

.PHONY: dev-d
dev-d: ## Start all development services (detached)
	cp -n .env.example .env 2>/dev/null || true
	$(DC) up --build -d

.PHONY: dev-down
dev-down: ## Stop development services
	$(DC) down

.PHONY: dev-clean
dev-clean: ## Stop and remove all development data (volumes)
	$(DC) down -v --remove-orphans

.PHONY: dev-logs
dev-logs: ## Follow all dev logs
	$(DC) logs -f

.PHONY: dev-logs-api
dev-logs-api: ## Follow backend logs
	$(DC) logs -f api

.PHONY: dev-shell-api
dev-shell-api: ## Shell into backend container
	$(DC) exec api sh

.PHONY: dev-shell-frontend
dev-shell-frontend: ## Shell into frontend container
	$(DC) exec frontend sh

.PHONY: dev-db
dev-db: ## Open MySQL CLI
	$(DC) exec mysql mysql -u anubisboost -pchangeme_dev_only anubisboost

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------

.PHONY: migrate
migrate: ## Run migrations (dev)
	$(DC) exec api node src/db/migrate.js

.PHONY: seed
seed: ## Run seed data (dev)
	$(DC) exec api node seeds/seed.js

# ---------------------------------------------------------------------------
# Production
# ---------------------------------------------------------------------------

.PHONY: prod-build
prod-build: ## Build production images
	$(DC_PROD) build

.PHONY: prod-up
prod-up: ## Start production services
	$(DC_PROD) up -d

.PHONY: prod-down
prod-down: ## Stop production services
	$(DC_PROD) down

.PHONY: prod-logs
prod-logs: ## Follow production logs
	$(DC_PROD) logs -f

.PHONY: prod-ps
prod-ps: ## Show production container status
	$(DC_PROD) ps

.PHONY: prod-restart-api
prod-restart-api: ## Restart API with zero-downtime (rebuild + restart)
	$(DC_PROD) build api
	$(DC_PROD) up -d --no-deps api

.PHONY: prod-backup-db
prod-backup-db: ## Backup production database
	./scripts/backup-db.sh

# ---------------------------------------------------------------------------
# SSL
# ---------------------------------------------------------------------------

.PHONY: ssl-init
ssl-init: ## Obtain initial SSL certificate
	./scripts/ssl-init.sh

.PHONY: ssl-renew
ssl-renew: ## Force SSL renewal
	$(DC_PROD) exec certbot certbot renew --force-renewal

# ---------------------------------------------------------------------------
# Utilities
# ---------------------------------------------------------------------------

.PHONY: clean-images
clean-images: ## Remove dangling Docker images
	docker image prune -f

.PHONY: status
status: ## Show all container statuses
	docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

.PHONY: help
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'
