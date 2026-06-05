.PHONY: run dev test lint typecheck format clean

# ── Development ───────────────────────────────────────────────────────────────
run:
	uvicorn main:app --reload --host 0.0.0.0 --port 8000

dev:
	uvicorn main:app --reload --host 0.0.0.0 --port 8000 --log-level debug

# ── Testing ───────────────────────────────────────────────────────────────────
test:
	pytest tests/ -v --tb=short

test-cov:
	pytest tests/ -v --cov=app --cov-report=html

# ── Code Quality ──────────────────────────────────────────────────────────────
lint:
	ruff check app/

format:
	ruff format app/

typecheck:
	mypy app/ --ignore-missing-imports

check: lint typecheck
	@echo "✅ All checks passed"

# ── Setup ─────────────────────────────────────────────────────────────────────
install:
	pip install -r requirements.txt

venv:
	python -m venv venv
	@echo "Activate with: venv\\Scripts\\activate (Windows) or source venv/bin/activate (Mac/Linux)"

# ── Cleanup ───────────────────────────────────────────────────────────────────
clean:
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -name "*.pyc" -delete
	rm -rf .mypy_cache .ruff_cache .pytest_cache htmlcov
