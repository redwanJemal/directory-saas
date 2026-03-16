# Task 47: Production Deployment — Coolify, Domain Routing, SSL

## Summary
Configure production deployment with Docker Compose for Coolify, Traefik reverse proxy labels for subdomain routing, nginx configs for all SPAs, production environment setup, and deployment scripts. Subdomain plan: `api.{DOMAIN}` for backend, `app.{DOMAIN}` for web client, `admin.{DOMAIN}` for admin, and `*.{DOMAIN}` (wildcard) for provider portals resolved by tenant slug.

## Current State
- `docker/docker-compose.coolify.yml` exists with basic service definitions (api, web, provider-portal, admin, postgres, redis, minio, meilisearch)
- Services use internal + coolify networks
- No Traefik labels for subdomain routing
- `docker/nginx/spa.conf` exists but is basic
- Dockerfiles exist: `Dockerfile.api`, `Dockerfile.web`, `Dockerfile.provider`, `Dockerfile.admin`
- Backend `TenantResolutionMiddleware` already handles subdomain → tenant resolution
- No `.env.production.example`
- No deployment script
- No deployment documentation

## Required Changes

### 47.1 Update docker-compose.coolify.yml

Rewrite `docker/docker-compose.coolify.yml` with Traefik labels, health checks, proper environment, and subdomain routing:

```yaml
services:
  api:
    build:
      context: ..
      dockerfile: docker/Dockerfile.api
    container_name: directory-saas-api
    restart: unless-stopped
    environment:
      NODE_ENV: production
      APP_PORT: 3000
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}?schema=public
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ${REDIS_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      JWT_ACCESS_EXPIRY: ${JWT_ACCESS_EXPIRY:-15m}
      JWT_REFRESH_EXPIRY: ${JWT_REFRESH_EXPIRY:-7d}
      CORS_ORIGINS: ${CORS_ORIGINS}
      S3_ENDPOINT: http://minio:9000
      S3_PUBLIC_URL: ${S3_PUBLIC_URL:-https://s3.${DOMAIN}}
      S3_ACCESS_KEY: ${MINIO_ROOT_USER}
      S3_SECRET_KEY: ${MINIO_ROOT_PASSWORD}
      S3_BUCKET: ${S3_BUCKET:-directory-saas}
      S3_REGION: ${S3_REGION:-us-east-1}
      MEILISEARCH_URL: http://meilisearch:7700
      MEILISEARCH_API_KEY: ${MEILI_MASTER_KEY}
      SMTP_HOST: ${SMTP_HOST}
      SMTP_PORT: ${SMTP_PORT:-587}
      SMTP_USER: ${SMTP_USER}
      SMTP_PASS: ${SMTP_PASS}
      SMTP_FROM: ${SMTP_FROM}
      SMTP_SECURE: ${SMTP_SECURE:-true}
      LOG_LEVEL: ${LOG_LEVEL:-info}
      THROTTLE_TTL: ${THROTTLE_TTL:-60}
      THROTTLE_LIMIT: ${THROTTLE_LIMIT:-100}
      DOMAIN: ${DOMAIN}
    networks:
      - internal
      - coolify
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      meilisearch:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 40s
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.api.rule=Host(`api.${DOMAIN}`)"
      - "traefik.http.routers.api.entrypoints=https"
      - "traefik.http.routers.api.tls=true"
      - "traefik.http.services.api.loadbalancer.server.port=3000"
      - "traefik.http.routers.api.middlewares=api-cors@docker"
      # CORS middleware
      - "traefik.http.middlewares.api-cors.headers.accesscontrolallowmethods=GET,POST,PUT,PATCH,DELETE,OPTIONS"
      - "traefik.http.middlewares.api-cors.headers.accesscontrolallowheaders=Content-Type,Authorization,X-Tenant-ID,X-Tenant-Slug"
      - "traefik.http.middlewares.api-cors.headers.accesscontrolalloworiginlist=https://app.${DOMAIN},https://admin.${DOMAIN},https://*.${DOMAIN}"
      - "traefik.http.middlewares.api-cors.headers.accesscontrolmaxage=86400"

  web:
    build:
      context: ..
      dockerfile: docker/Dockerfile.web
      args:
        VITE_API_URL: https://api.${DOMAIN}
        VITE_BRAND_NAME: ${BRAND_NAME:-Directory SaaS}
        VITE_BRAND_HUE: ${BRAND_HUE:-230}
    container_name: directory-saas-web
    restart: unless-stopped
    networks:
      - internal
      - coolify
    depends_on:
      - api
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80/"]
      interval: 30s
      timeout: 5s
      retries: 3
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.web.rule=Host(`app.${DOMAIN}`)"
      - "traefik.http.routers.web.entrypoints=https"
      - "traefik.http.routers.web.tls=true"
      - "traefik.http.services.web.loadbalancer.server.port=80"

  admin:
    build:
      context: ..
      dockerfile: docker/Dockerfile.admin
      args:
        VITE_API_URL: https://api.${DOMAIN}
        VITE_BRAND_NAME: ${BRAND_NAME:-Directory SaaS}
        VITE_BRAND_HUE: ${BRAND_HUE:-230}
    container_name: directory-saas-admin
    restart: unless-stopped
    networks:
      - internal
      - coolify
    depends_on:
      - api
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80/"]
      interval: 30s
      timeout: 5s
      retries: 3
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.admin.rule=Host(`admin.${DOMAIN}`)"
      - "traefik.http.routers.admin.entrypoints=https"
      - "traefik.http.routers.admin.tls=true"
      - "traefik.http.services.admin.loadbalancer.server.port=80"

  provider-portal:
    build:
      context: ..
      dockerfile: docker/Dockerfile.provider
      args:
        VITE_API_URL: https://api.${DOMAIN}
        VITE_BRAND_NAME: ${BRAND_NAME:-Directory SaaS}
        VITE_BRAND_HUE: ${BRAND_HUE:-230}
    container_name: directory-saas-provider
    restart: unless-stopped
    networks:
      - internal
      - coolify
    depends_on:
      - api
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80/"]
      interval: 30s
      timeout: 5s
      retries: 3
    labels:
      - "traefik.enable=true"
      # Wildcard: any subdomain not matched by api/web/admin → provider portal
      # Priority lower than specific subdomain routes
      - "traefik.http.routers.provider.rule=HostRegexp(`{subdomain:[a-z0-9-]+}.${DOMAIN}`) && !Host(`api.${DOMAIN}`) && !Host(`app.${DOMAIN}`) && !Host(`admin.${DOMAIN}`)"
      - "traefik.http.routers.provider.entrypoints=https"
      - "traefik.http.routers.provider.tls=true"
      - "traefik.http.routers.provider.priority=1"
      - "traefik.http.services.provider.loadbalancer.server.port=80"

  postgres:
    image: pgvector/pgvector:pg16
    container_name: directory-saas-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-directory}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB:-directory_saas}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - internal
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-directory}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: directory-saas-redis
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD} --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    networks:
      - internal
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio:latest
    container_name: directory-saas-minio
    restart: unless-stopped
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data
    networks:
      - internal
      - coolify
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]
      interval: 10s
      timeout: 5s
      retries: 5
    labels:
      - "traefik.enable=true"
      # MinIO API (for public file access via presigned URLs)
      - "traefik.http.routers.minio.rule=Host(`s3.${DOMAIN}`)"
      - "traefik.http.routers.minio.entrypoints=https"
      - "traefik.http.routers.minio.tls=true"
      - "traefik.http.services.minio.loadbalancer.server.port=9000"

  meilisearch:
    image: getmeili/meilisearch:v1.12
    container_name: directory-saas-meilisearch
    restart: unless-stopped
    environment:
      MEILI_MASTER_KEY: ${MEILI_MASTER_KEY}
      MEILI_ENV: production
      MEILI_MAX_INDEXING_MEMORY: 512MiB
    volumes:
      - meilisearch_data:/meili_data
    networks:
      - internal
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--spider", "http://localhost:7700/health"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
  minio_data:
  meilisearch_data:

networks:
  internal:
    driver: bridge
  coolify:
    external: true
```

### 47.2 Production Environment Template

Create `docker/.env.production.example`:

```env
# =============================================================================
# Directory SaaS — Production Environment Variables
# Copy to .env and fill in all values
# =============================================================================

# Domain (no protocol, no trailing slash)
DOMAIN=example.com

# Brand
BRAND_NAME=Directory SaaS
BRAND_HUE=230

# CORS — list all app origins
CORS_ORIGINS=https://app.example.com,https://admin.example.com

# PostgreSQL
POSTGRES_USER=directory
POSTGRES_PASSWORD=CHANGE_ME_STRONG_PASSWORD
POSTGRES_DB=directory_saas

# Redis
REDIS_PASSWORD=CHANGE_ME_STRONG_PASSWORD

# JWT — generate with: openssl rand -base64 64
JWT_SECRET=CHANGE_ME_LONG_RANDOM_STRING
JWT_REFRESH_SECRET=CHANGE_ME_DIFFERENT_LONG_RANDOM_STRING
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# MinIO / S3
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=CHANGE_ME_STRONG_PASSWORD
S3_BUCKET=directory-saas
S3_REGION=us-east-1
S3_PUBLIC_URL=https://s3.example.com

# Meilisearch — generate with: openssl rand -hex 32
MEILI_MASTER_KEY=CHANGE_ME_RANDOM_HEX_STRING

# SMTP (example: Amazon SES, Postmark, Resend, etc.)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=CHANGE_ME
SMTP_FROM=noreply@example.com
SMTP_SECURE=true

# Logging
LOG_LEVEL=info

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

### 47.3 Nginx Configuration for SPAs

Create separate nginx configs for each SPA. The key requirements:
- SPA fallback: `try_files $uri $uri/ /index.html`
- Gzip compression
- Static asset caching (1 year for hashed files)
- Security headers
- API proxy pass for development convenience (optional, Traefik handles in prod)

**docker/nginx/web.conf:**

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # Hashed static assets — cache 1 year
    location ~* \.(?:js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|ico|webp|avif)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # index.html — never cache (SPA entry point)
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "OK";
        add_header Content-Type text/plain;
    }
}
```

**docker/nginx/admin.conf** — Same as web.conf (identical SPA serving pattern).

**docker/nginx/provider.conf** — Same as web.conf. The provider portal SPA reads the subdomain from `window.location.hostname` and sends it as `X-Tenant-Slug` header to the API. This is handled in the frontend code (already implemented in provider-portal app), not nginx.

Update the Dockerfiles for each SPA to `COPY` the correct nginx config:

```dockerfile
# In Dockerfile.web:
COPY docker/nginx/web.conf /etc/nginx/conf.d/default.conf

# In Dockerfile.admin:
COPY docker/nginx/admin.conf /etc/nginx/conf.d/default.conf

# In Dockerfile.provider:
COPY docker/nginx/provider.conf /etc/nginx/conf.d/default.conf
```

### 47.4 Backend Production Configuration

Ensure the backend `config/` module handles production settings:

- `NODE_ENV=production` → structured JSON logging (Pino), no pretty printing
- `CORS_ORIGINS` → parsed as comma-separated list, set on NestJS CORS config
- Connection pooling: Prisma default pool size is fine for production (10 connections); document `?connection_limit=20` option in DATABASE_URL
- Rate limiting: tuned via `THROTTLE_TTL` and `THROTTLE_LIMIT` env vars
- JWT secrets: validated as non-empty, minimum length
- Health check endpoint: `/api/v1/health` with readiness probe (checks DB, Redis, Meilisearch)

### 47.5 Provider Subdomain Routing

The subdomain routing works as follows in production:

1. **DNS**: Cloudflare wildcard DNS `*.example.com` → VPS IP
2. **Traefik** (Coolify's reverse proxy): Routes based on labels
   - `api.example.com` → api service
   - `app.example.com` → web SPA
   - `admin.example.com` → admin SPA
   - `{anything-else}.example.com` → provider-portal SPA (wildcard rule with low priority)
3. **Provider Portal SPA**: JavaScript reads `window.location.hostname`, extracts subdomain, stores as tenant slug
4. **API requests**: Provider portal sends `X-Tenant-Slug: {subdomain}` header on all API calls
5. **Backend**: `TenantResolutionMiddleware` resolves tenant from `X-Tenant-Slug` header (already implemented)

Document that the wildcard DNS must be configured in Cloudflare:
- Type: A record
- Name: `*`
- Content: VPS IP address
- Proxy status: Proxied (orange cloud) for SSL

### 47.6 SSL Configuration

SSL is handled automatically by the Cloudflare + Coolify combination:
- Cloudflare provides edge SSL (client → Cloudflare)
- Coolify/Traefik provides origin SSL (Cloudflare → server) via Let's Encrypt or Cloudflare origin certificates
- Configure Cloudflare SSL mode to "Full (strict)" for end-to-end encryption

Document this in the deployment guide — no manual SSL certificate management needed.

### 47.7 Deployment Script

Create `scripts/deploy.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

# Directory SaaS — Production Deployment Script
# Usage: ./scripts/deploy.sh [build|deploy|migrate|seed|status|logs]

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
  docker compose -f "$COMPOSE_FILE" build --no-cache "$@"
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
    echo "  build    Build Docker images"
    echo "  deploy   Build, start services, wait for health"
    echo "  migrate  Run Prisma migrations"
    echo "  seed     Seed the database"
    echo "  status   Show service status and endpoints"
    echo "  logs     Tail service logs (optionally specify service name)"
    echo "  stop     Stop all services"
    exit 1
    ;;
esac
```

### 47.8 Deployment Documentation

Create `docs/deployment.md`:

Document the full deployment process:

1. **Prerequisites**: VPS with Docker, Coolify installed, domain pointed to VPS
2. **DNS Setup**: Cloudflare A records (root domain + wildcard)
3. **Environment Setup**: Copy `.env.production.example` → `.env`, fill in values
4. **Deploy**: `./scripts/deploy.sh deploy`
5. **Migrate**: `./scripts/deploy.sh migrate`
6. **Seed** (first deploy only): `./scripts/deploy.sh seed`
7. **Verify**: Check all endpoints
8. **SSL**: Cloudflare SSL mode → Full (strict)
9. **Monitoring**: `./scripts/deploy.sh logs`, `./scripts/deploy.sh status`
10. **Updates**: Pull latest code → `./scripts/deploy.sh deploy` → `./scripts/deploy.sh migrate`

Include troubleshooting section for common issues.

## Acceptance Criteria
- [ ] `docker-compose.coolify.yml` defines all services with health checks
- [ ] Traefik labels route `api.{DOMAIN}` → backend API
- [ ] Traefik labels route `app.{DOMAIN}` → web SPA
- [ ] Traefik labels route `admin.{DOMAIN}` → admin SPA
- [ ] Traefik wildcard rule routes `*.{DOMAIN}` → provider portal (excluding api/app/admin)
- [ ] All services on internal network for inter-service communication
- [ ] API and SPA services on coolify network for Traefik access
- [ ] Nginx configs serve SPAs with gzip, caching, SPA fallback, security headers
- [ ] `.env.production.example` documents ALL required environment variables
- [ ] No secrets in example file — only templates/placeholders
- [ ] Backend CORS configured for all app domains
- [ ] Deployment script (`scripts/deploy.sh`) handles build, deploy, migrate, seed, status, logs
- [ ] Deployment documentation covers full process from DNS to running app
- [ ] Provider subdomain resolution works end-to-end (subdomain → SPA → API header → tenant context)
- [ ] SSL documented (Cloudflare + Coolify automatic)
- [ ] Domain is configurable via `DOMAIN` env var — not hardcoded anywhere

## Files to Create/Modify
- `docker/docker-compose.coolify.yml` (rewrite)
- `docker/.env.production.example` (create)
- `docker/nginx/web.conf` (create)
- `docker/nginx/admin.conf` (create)
- `docker/nginx/provider.conf` (create)
- `docker/nginx/spa.conf` (may remove if replaced by per-app configs)
- `docker/Dockerfile.web` (update — COPY correct nginx config)
- `docker/Dockerfile.admin` (update — COPY correct nginx config)
- `docker/Dockerfile.provider` (update — COPY correct nginx config)
- `scripts/deploy.sh` (create)
- `docs/deployment.md` (create)

## Dependencies
- Tasks 01-27 (backend complete)
- Tasks 28-40 (frontend apps complete)
- Task 26: Docker Compose (base Docker setup)
