.PHONY: help up down restart logs build test lint shell-api shell-db shell-redis dev-frontend

help:
	@echo "Available commands:"
	@echo "  make up           Start all services in background"
	@echo "  make down         Stop all services"
	@echo "  make restart      Restart all services"
	@echo "  make logs         Follow container logs"
	@echo "  make build        Build docker images"
	@echo "  make test         Run backend test suite"
	@echo "  make lint         Check formatting and typing"
	@echo "  make dev-frontend Start Next.js frontend locally"
	@echo "  make shell-api    Open a shell in the API container"
	@echo "  make shell-db     Connect to Postgres with psql"
	@echo "  make shell-redis  Connect to Redis with redis-cli"

up:
	docker compose up -d

down:
	docker compose down

restart:
	docker compose restart

logs:
	docker compose logs -f

build:
	docker compose build

test:
	docker compose exec api pytest -v

lint:
	docker compose exec api ruff check .

shell-api:
	docker compose exec api /bin/bash

shell-db:
	docker compose exec postgres psql -U pulse_user -d pulse_db

shell-redis:
	docker compose exec redis redis-cli

dev-frontend:
	cd frontend && npm run dev
