#!/usr/bin/env bash
set -euo pipefail

# Directory SaaS — Production Deployment Script
# Usage: ./scripts/deploy.sh [build|deploy|migrate|seed|status|logs|stop]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DOCKER_DIR="$PROJECT_DIR/docker"
COMPOSE_FILE="$DOCKER_DIR/docker-compose.coolify.yml"

# Load environment
if [ -f "$DOCKER_DIR/.env" ]; then
  set -a
  source "$DOCKER_DIR/.env"
  set +a
fi

DOMAIN="${DOMAIN:-localhost}"

function log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

function cmd_build() {
  log "Building Docker images..."
  docker compose -f "$COMPOSE_FILE" build "$@"
  log "Build complete."
}

function cmd_deploy() {
  log "Deploying to $DOMAIN..."

  # Build images
  docker compose -f "$COMPOSE_FILE" build

  # Start/restart services
  docker compose -f "$COMPOSE_FILE" up -d

  # Wait for API health
  log "Waiting for API to be healthy..."
  local retries=30
  while [ $retries -gt 0 ]; do
    if docker compose -f "$COMPOSE_FILE" exec api curl -sf http://localhost:3000/api/v1/health > /dev/null 2>&1; then
      log "API is healthy!"
      break
    fi
    retries=$((retries - 1))
    sleep 2
  done

  if [ $retries -eq 0 ]; then
    log "ERROR: API did not become healthy in time"
    docker compose -f "$COMPOSE_FILE" logs api --tail=50
    exit 1
  fi

  log "Deployment complete!"
  cmd_status
}

function cmd_migrate() {
  log "Running database migrations..."
  docker compose -f "$COMPOSE_FILE" exec api npx prisma migrate deploy
  log "Migrations complete."
}

function cmd_seed() {
  log "Seeding database..."
  docker compose -f "$COMPOSE_FILE" exec api npx prisma db seed
  log "Seed complete."
}

function cmd_status() {
  log "Service status:"
  docker compose -f "$COMPOSE_FILE" ps
  echo ""
  log "Endpoints:"
  echo "  API:      https://api.$DOMAIN"
  echo "  Web App:  https://app.$DOMAIN"
  echo "  Admin:    https://admin.$DOMAIN"
  echo "  Provider: https://{slug}.$DOMAIN"
  echo "  Storage:  https://s3.$DOMAIN"
}

function cmd_logs() {
  docker compose -f "$COMPOSE_FILE" logs -f "${1:-}"
}

function cmd_stop() {
  log "Stopping services..."
  docker compose -f "$COMPOSE_FILE" down
  log "Services stopped."
}

# Main
case "${1:-help}" in
  build)   shift; cmd_build "$@" ;;
  deploy)  cmd_deploy ;;
  migrate) cmd_migrate ;;
  seed)    cmd_seed ;;
  status)  cmd_status ;;
  logs)    shift; cmd_logs "${1:-}" ;;
  stop)    cmd_stop ;;
  *)
    echo "Usage: $0 {build|deploy|migrate|seed|status|logs|stop}"
    echo ""
    echo "Commands:"
    echo "  build    Build Docker images (pass --no-cache for fresh build)"
    echo "  deploy   Build, start services, wait for health"
    echo "  migrate  Run Prisma migrations"
    echo "  seed     Seed the database"
    echo "  status   Show service status and endpoints"
    echo "  logs     Tail service logs (optionally specify service name)"
    echo "  stop     Stop all services"
    exit 1
    ;;
esac
