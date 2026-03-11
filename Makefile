.DEFAULT_GOAL := help

# ── Setup ────────────────────────────────────────────────────────────────────

install: install-backend install-frontend ## Install all dependencies

install-backend: ## Install backend Python dependencies
	cd backend && poetry install

install-frontend: ## Install frontend Node dependencies
	cd frontend && pnpm install

# ── Local Services ───────────────────────────────────────────────────────────

services: ## Start Docker services (Redis)
	docker-compose up -d

services-stop: ## Stop Docker services
	docker-compose down

# ── Backend Dev ──────────────────────────────────────────────────────────────

dev: ## Start FastAPI dev server (port 8000)
	cd backend && poetry run uvicorn main:app --reload --port 8000

# ── Frontend Dev ─────────────────────────────────────────────────────────────

fe-dev: ## Start frontend dev server (port 5173)
	cd frontend && pnpm dev

fe-build: ## Production build (typecheck + vite build)
	cd frontend && pnpm build

fe-preview: ## Preview production build
	cd frontend && pnpm preview

# ── Testing ──────────────────────────────────────────────────────────────────

test: ## Run all backend tests
	cd backend && poetry run pytest tests/ -v

test-cov: ## Run backend tests with coverage
	cd backend && poetry run pytest tests/ -v --cov=. --cov-report=html

test-file: ## Run a single test file: make test-file F=test_auth
	cd backend && poetry run pytest tests/$(F).py -v

test-one: ## Run a single test: make test-one F=test_auth T=test_health
	cd backend && poetry run pytest tests/$(F).py::$(T) -v

# ── Code Quality ─────────────────────────────────────────────────────────────

lint: lint-backend lint-frontend ## Lint everything

lint-backend: ## Run ruff check + mypy on backend
	cd backend && poetry run ruff check . && poetry run mypy .

lint-frontend: ## Run ESLint on frontend
	cd frontend && pnpm lint

format: format-backend format-frontend ## Format everything

format-backend: ## Format backend with ruff
	cd backend && poetry run ruff format .

format-frontend: ## Format frontend with prettier
	cd frontend && pnpm format

typecheck: ## TypeScript type check (frontend)
	cd frontend && pnpm typecheck

# ── Database ─────────────────────────────────────────────────────────────────

migrate: ## Apply all pending Alembic migrations
	cd backend && poetry run alembic upgrade head

migrate-down: ## Rollback last Alembic migration
	cd backend && poetry run alembic downgrade -1

migration: ## Generate new migration (prompts for name)
	@read -p "Migration name: " name; cd backend && poetry run alembic revision --autogenerate -m "$$name"

# ── Workers ──────────────────────────────────────────────────────────────────

fetch-worker: ## Start job fetch worker
	cd backend && poetry run python -m workers.fetch

fetch-worker-dev: ## Start job fetch worker with auto-reload
	cd backend && poetry run watchfiles "python -m workers.fetch" --filter python

enrich-worker: ## Start enrichment worker
	cd backend && poetry run python -m workers.enrich

enrich-worker-dev: ## Start enrichment worker with auto-reload
	cd backend && poetry run watchfiles "python -m workers.enrich" --filter python

score-worker: ## Start scoring worker
	cd backend && poetry run python -m workers.score

score-worker-dev: ## Start scoring worker with auto-reload
	cd backend && poetry run watchfiles "python -m workers.score" --filter python

cron-fetch: ## Trigger fetch cron via local API
	curl -sf -X POST -H "X-Internal-API-Key: $${INTERNAL_API_KEY}" http://localhost:8000/api/internal/scheduler/fetch

# ── Utilities ────────────────────────────────────────────────────────────────

docs: ## Open API docs in browser
	open http://localhost:8000/docs

clean: ## Remove Python cache files
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "htmlcov" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null || true

# ── Help ─────────────────────────────────────────────────────────────────────

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

.PHONY: install install-backend install-frontend \
	services services-stop \
	dev fe-dev fe-build fe-preview \
	test test-cov test-file test-one \
	lint lint-backend lint-frontend format format-backend format-frontend typecheck \
	migrate migrate-down migration \
	fetch-worker fetch-worker-dev enrich-worker enrich-worker-dev score-worker score-worker-dev cron-fetch \
	docs clean help
