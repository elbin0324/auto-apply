.PHONY: dev test migrate lint services clean help worker score-worker enrich-worker

# ── Local Services ────────────────────────────────────────────────────────────
services:
	docker-compose up -d

services-stop:
	docker-compose down

# ── Backend ───────────────────────────────────────────────────────────────────
dev:
	cd backend && poetry run uvicorn main:app --reload --port 8000

test:
	cd backend && poetry run pytest tests/ -v

test-cov:
	cd backend && poetry run pytest tests/ -v --cov=. --cov-report=html

# ── Background Worker ────────────────────────────────────────────────────────
worker:
	cd backend && poetry run arq worker.WorkerSettings

worker-dev:
	cd backend && poetry run watchfiles "arq worker.WorkerSettings" --filter python

# ── Queue Workers ─────────────────────────────────────────────────────────
score-worker:
	cd backend && poetry run python -m workers.score

score-worker-dev:
	cd backend && poetry run watchfiles "python -m workers.score" --filter python

enrich-worker:
	cd backend && poetry run python -m workers.enrich

enrich-worker-dev:
	cd backend && poetry run watchfiles "python -m workers.enrich" --filter python

# ── Database ──────────────────────────────────────────────────────────────────
migrate:
	cd backend && poetry run alembic upgrade head

migrate-down:
	cd backend && poetry run alembic downgrade -1

migration:
	@read -p "Migration name: " name; cd backend && poetry run alembic revision --autogenerate -m "$$name"

# ── Code Quality ──────────────────────────────────────────────────────────────
lint:
	cd backend && poetry run ruff check . && poetry run mypy .

format:
	cd backend && poetry run ruff format .

# ── Utilities ─────────────────────────────────────────────────────────────────
clean:
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "htmlcov" -exec rm -rf {} + 2>/dev/null || true

stripe-listen:
	stripe listen --forward-to localhost:8000/api/billing/webhooks/stripe

docs:
	open http://localhost:8000/docs

help:
	@echo "Available targets:"
	@echo "  services      - Start Docker services (Redis)"
	@echo "  services-stop - Stop Docker services"
	@echo "  dev           - Start FastAPI dev server"
	@echo "  test          - Run test suite"
	@echo "  test-cov      - Run tests with coverage report"
	@echo "  migrate       - Apply all pending migrations"
	@echo "  migrate-down  - Rollback last migration"
	@echo "  migration     - Generate new migration (prompts for name)"
	@echo "  lint          - Run ruff + mypy"
	@echo "  format        - Format code with ruff"
	@echo "  clean         - Remove cache files"
	@echo "  stripe-listen - Start Stripe webhook listener (local dev)"
	@echo "  worker        - Start arq background worker (fetch + rematch)"
	@echo "  worker-dev    - Start arq worker with auto-reload"
	@echo "  score-worker  - Start score worker (consumes score:jobs queue)"
	@echo "  enrich-worker - Start enrich worker (consumes enrich:jobs queue)"
	@echo "  docs          - Open API docs in browser"
