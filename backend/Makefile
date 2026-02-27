.PHONY: dev test test-cov migrate migrate-down migration lint format clean help

# ── Development ───────────────────────────────────────────────────────────────
dev:
	poetry run uvicorn main:app --reload --port 8000

# ── Testing ───────────────────────────────────────────────────────────────────
test:
	poetry run pytest tests/ -v

test-cov:
	poetry run pytest tests/ -v --cov=. --cov-report=html

# ── Database / Migrations ─────────────────────────────────────────────────────
migrate:
	poetry run alembic upgrade head

migrate-down:
	poetry run alembic downgrade -1

migration:
	@read -p "Migration name: " name; poetry run alembic revision --autogenerate -m "$$name"

# ── Code Quality ──────────────────────────────────────────────────────────────
lint:
	poetry run ruff check . && poetry run mypy .

format:
	poetry run ruff format .

# ── Utilities ─────────────────────────────────────────────────────────────────
clean:
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "htmlcov" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null || true

help:
	@echo "Available targets:"
	@echo "  dev          - Start FastAPI dev server (port 8000)"
	@echo "  test         - Run test suite"
	@echo "  test-cov     - Run tests with coverage report"
	@echo "  migrate      - Apply all pending migrations"
	@echo "  migrate-down - Rollback last migration"
	@echo "  migration    - Generate new migration (prompts for name)"
	@echo "  lint         - Run ruff + mypy"
	@echo "  format       - Format code with ruff"
	@echo "  clean        - Remove cache files"
