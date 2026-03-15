# Task 26: Docker Compose — Dev + Coolify Production

## Summary
Create Docker Compose configurations for development and Coolify production deployment, with Dockerfiles for all services, health checks, and network configuration.

## Current State
- Basic Docker Compose for infrastructure services (Task 01).
- All application services running locally.

## Required Changes

### 26.1 Development Docker Compose

**File**: `docker/docker-compose.yml`

Services:
```yaml
services:
  postgres:
    image: pgvector/pgvector:pg16  # PostgreSQL 16 with pgvector
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck: pg_isready

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    healthcheck: redis-cli ping

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    healthcheck: curl -f http://localhost:9000/minio/health/live

  meilisearch:
    image: getmeili/meilisearch:v1.6
    healthcheck: curl -f http://localhost:7700/health

  mailpit:
    image: axllent/mailpit:latest
    # Web UI: 8025, SMTP: 1025
```

### 26.2 Coolify Production Docker Compose

**File**: `docker/docker-compose.coolify.yml`

```yaml
services:
  api:
    build: { context: .., dockerfile: docker/Dockerfile.api }
    networks: [internal, coolify]
    healthcheck: curl -f http://localhost:3000/health
    depends_on: [postgres, redis]

  web:
    build: { context: .., dockerfile: docker/Dockerfile.web }
    networks: [internal, coolify]

  provider-portal:
    build: { context: .., dockerfile: docker/Dockerfile.provider }
    networks: [internal, coolify]

  admin:
    build: { context: .., dockerfile: docker/Dockerfile.admin }
    networks: [internal, coolify]

  postgres:
    networks: [internal]
  redis:
    networks: [internal]
  minio:
    networks: [internal, coolify]
  meilisearch:
    networks: [internal]

networks:
  internal:
    driver: bridge
  coolify:
    external: true
```

### 26.3 Dockerfiles

**`docker/Dockerfile.api`** — Multi-stage NestJS build:
```dockerfile
# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend/ .
RUN npx prisma generate && npm run build

# Stage 2: Production
FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

**`docker/Dockerfile.web`** — React SPA + Nginx:
```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY apps/web/package*.json ./
RUN npm ci
COPY apps/web/ .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/nginx/spa.conf /etc/nginx/conf.d/default.conf
```

Same pattern for `Dockerfile.provider` and `Dockerfile.admin`.

**`docker/nginx/spa.conf`** — SPA fallback:
```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;
  location / { try_files $uri $uri/ /index.html; }
  location /assets { expires 1y; add_header Cache-Control "public, immutable"; }
}
```

### 26.4 Environment File

**File**: `docker/.env.example`

All variables with descriptions and safe defaults for dev.

### 26.5 Tests

- Verify `docker compose config` validates for both compose files
- Verify all services start and pass health checks
- Verify Dockerfiles build successfully

## Acceptance Criteria

1. Dev Docker Compose starts all infrastructure
2. Coolify Docker Compose deploys full stack
3. All services have health checks
4. Multi-stage Dockerfiles (small images)
5. Nginx SPA routing for frontend apps
6. Coolify external network for Traefik routing
