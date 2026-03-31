# Makefile for Pricely Project

.PHONY: help dev build test clean docker-up docker-down docker-logs

# Default target
help:
	@echo "Pricely - 基于价格行为学的裸K分析平台"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  dev           - Start development environment"
	@echo "  build         - Build production bundles"
	@echo "  test          - Run all tests"
	@echo "  lint          - Run linting"
	@echo "  clean         - Clean build artifacts"
	@echo "  docker-up     - Start Docker containers"
	@echo "  docker-down   - Stop Docker containers"
	@echo "  docker-logs   - Show Docker logs"
	@echo "  docker-build  - Build Docker images"
	@echo ""

# Development
dev-frontend:
	cd frontend && npm run dev

dev-backend:
	cd backend && uvicorn app.main:app --reload

dev:
	@echo "Starting development environment..."
	@echo "Frontend: http://localhost:3000"
	@echo "Backend: http://localhost:8000"
	@echo "API Docs: http://localhost:8000/docs"

# Build
build-frontend:
	cd frontend && npm run build

build-backend:
	cd backend && pip install -e .

build: build-frontend build-backend

# Testing
test-frontend:
	cd frontend && npm run test

test-backend:
	cd backend && pytest

test: test-frontend test-backend

# Linting
lint-frontend:
	cd frontend && npm run lint

lint-backend:
	cd backend && ruff check .

lint: lint-frontend lint-backend

# Docker
docker-up:
	docker-compose up -d
	@echo "Services started:"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend:  http://localhost:8000"
	@echo "  API Docs: http://localhost:8000/docs"

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f

docker-build:
	docker-compose build

docker-clean:
	docker-compose down -v --rmi local

# Production
prod-up:
	docker-compose --profile production up -d

prod-down:
	docker-compose --profile production down

# Clean
clean:
	rm -rf frontend/dist
	rm -rf frontend/node_modules
	rm -rf backend/__pycache__
	rm -rf backend/.pytest_cache
	rm -rf backend/.ruff_cache
	rm -rf backend/.mypy_cache
	rm -rf backend/logs

# Database
db-init:
	cd backend && python -m app.models.init_db

db-reset:
	docker-compose down -v
	docker-compose up -d postgres redis
	sleep 5
	$(MAKE) db-init