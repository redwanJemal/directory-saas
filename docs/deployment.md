# Deployment Guide

Production deployment guide for Directory SaaS using Docker Compose, Coolify, and Cloudflare.

## Architecture

```
                    ┌─────────────────┐
                    │   Cloudflare    │
                    │  (DNS + Edge SSL)│
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   VPS / Server  │
                    │  (Coolify +     │
                    │   Traefik)      │
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
   ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
   │ api.DOMAIN  │   │ app.DOMAIN  │   │admin.DOMAIN │
   │  (NestJS)   │   │  (Web SPA)  │   │ (Admin SPA) │
   └──────┬──────┘   └─────────────┘   └─────────────┘
          │
   ┌──────▼──────┐   ┌─────────────┐
   │  PostgreSQL  │   │ *.DOMAIN    │
   │  Redis       │   │ (Provider   │
   │  Meilisearch │   │  Portal SPA)│
   │  MinIO       │   └─────────────┘
   └─────────────┘
```

### Subdomain Routing

| Subdomain | Service | Purpose |
|-----------|---------|---------|
| `api.{DOMAIN}` | Backend API (NestJS) | REST API, health checks |
| `app.{DOMAIN}` | Web SPA | End client application |
| `admin.{DOMAIN}` | Admin SPA | Platform administration |
| `s3.{DOMAIN}` | MinIO | Public file access (presigned URLs) |
| `*.{DOMAIN}` | Provider Portal SPA | Tenant-specific provider dashboards |

The wildcard rule catches any subdomain not matched by `api`, `app`, `admin`, or `s3`. The provider portal JavaScript reads `window.location.hostname`, extracts the subdomain as the tenant slug, and sends it as `X-Tenant-Slug` header on all API requests. The backend `TenantResolutionMiddleware` resolves the tenant from this header.

## Prerequisites

- VPS with Docker Engine installed (Ubuntu 22.04+ recommended)
- [Coolify](https://coolify.io) installed on the VPS
- Domain name pointed to VPS IP
- Cloudflare account (recommended for DNS + SSL)

## 1. DNS Setup (Cloudflare)

Create the following DNS records pointing to your VPS IP address:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | `@` | `YOUR_VPS_IP` | Proxied |
| A | `*` | `YOUR_VPS_IP` | Proxied |

The wildcard (`*`) record handles all subdomains: `api`, `app`, `admin`, `s3`, and tenant slugs.

### SSL Configuration

1. In Cloudflare dashboard, go to **SSL/TLS** settings
2. Set SSL mode to **Full (strict)**
3. This provides end-to-end encryption:
   - **Client → Cloudflare**: Cloudflare's edge SSL certificate
   - **Cloudflare → Server**: Coolify/Traefik provides origin SSL via Let's Encrypt

No manual SSL certificate management is needed.

## 2. Environment Setup

```bash
# Clone the repository
git clone <repo-url> directory-saas
cd directory-saas

# Copy the production environment template
cp docker/.env.production.example docker/.env

# Edit with your values
nano docker/.env
```

### Required Environment Variables

All variables in `docker/.env` must be set. Key ones to change:

| Variable | Description | How to generate |
|----------|-------------|----------------|
| `DOMAIN` | Your domain (e.g., `example.com`) | — |
| `POSTGRES_PASSWORD` | Database password | `openssl rand -base64 32` |
| `REDIS_PASSWORD` | Redis password | `openssl rand -base64 32` |
| `JWT_SECRET` | JWT signing key | `openssl rand -base64 64` |
| `JWT_REFRESH_SECRET` | Refresh token signing key | `openssl rand -base64 64` |
| `MINIO_ROOT_PASSWORD` | Object storage password | `openssl rand -base64 32` |
| `MEILI_MASTER_KEY` | Search engine key | `openssl rand -hex 32` |
| `CORS_ORIGINS` | Allowed origins | `https://app.example.com,https://admin.example.com` |

### SMTP Configuration

Configure your email provider (Amazon SES, Postmark, Resend, etc.):

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-api-key
SMTP_FROM=noreply@example.com
SMTP_SECURE=true
```

## 3. Deploy

```bash
# Make the deploy script executable
chmod +x scripts/deploy.sh

# Build and start all services
./scripts/deploy.sh deploy

# Run database migrations
./scripts/deploy.sh migrate

# Seed the database (first deploy only)
./scripts/deploy.sh seed
```

## 4. Verify

Check that all services are running:

```bash
./scripts/deploy.sh status
```

Test each endpoint:

```bash
# API health check
curl https://api.example.com/api/v1/health

# Web app
curl -I https://app.example.com

# Admin app
curl -I https://admin.example.com
```

## 5. Monitoring

### View logs

```bash
# All services
./scripts/deploy.sh logs

# Specific service
./scripts/deploy.sh logs api
./scripts/deploy.sh logs postgres
./scripts/deploy.sh logs redis
```

### Service status

```bash
./scripts/deploy.sh status
```

## 6. Updates

```bash
# Pull latest code
git pull origin main

# Rebuild and redeploy
./scripts/deploy.sh deploy

# Run any new migrations
./scripts/deploy.sh migrate
```

## 7. Deployment Script Reference

| Command | Description |
|---------|-------------|
| `./scripts/deploy.sh build` | Build Docker images |
| `./scripts/deploy.sh deploy` | Build, start services, wait for health |
| `./scripts/deploy.sh migrate` | Run Prisma migrations |
| `./scripts/deploy.sh seed` | Seed the database |
| `./scripts/deploy.sh status` | Show service status and endpoints |
| `./scripts/deploy.sh logs [service]` | Tail service logs |
| `./scripts/deploy.sh stop` | Stop all services |

## Troubleshooting

### API container won't start

```bash
# Check API logs
docker logs directory-saas-api --tail=100

# Common causes:
# - DATABASE_URL is wrong → verify postgres container is healthy
# - Missing environment variables → check docker/.env
# - Port conflict → ensure port 3000 is free inside the container
```

### Database connection refused

```bash
# Check postgres is healthy
docker inspect directory-saas-postgres --format='{{.State.Health.Status}}'

# Check connectivity from API container
docker exec directory-saas-api curl -v telnet://postgres:5432
```

### SPA returns 404 on page refresh

This is handled by the nginx `try_files` directive in each SPA's config. If it happens:

```bash
# Verify nginx config is mounted correctly
docker exec directory-saas-web cat /etc/nginx/conf.d/default.conf
```

### Provider portal shows wrong tenant

The provider portal reads the subdomain from `window.location.hostname`. Verify:
1. DNS wildcard record exists for `*.example.com`
2. Cloudflare proxy is enabled (orange cloud)
3. The tenant slug in the database matches the subdomain

### Redis connection issues

```bash
# Test Redis connectivity
docker exec directory-saas-redis redis-cli -a "$REDIS_PASSWORD" ping

# Check Redis memory usage
docker exec directory-saas-redis redis-cli -a "$REDIS_PASSWORD" info memory
```

### SSL certificate errors

1. Verify Cloudflare SSL mode is **Full (strict)**
2. Check that Coolify/Traefik has generated origin certificates
3. Wait a few minutes after initial deployment for certificate provisioning

### Meilisearch not indexing

```bash
# Check Meilisearch health
docker exec directory-saas-meilisearch wget -qO- http://localhost:7700/health

# Check indexing tasks
curl -H "Authorization: Bearer $MEILI_MASTER_KEY" https://api.example.com/api/v1/health/ready
```

### Disk space issues

```bash
# Check Docker disk usage
docker system df

# Clean unused images and containers
docker system prune -f

# Clean unused volumes (CAUTION: removes data)
# docker volume prune -f
```

## Production Checklist

- [ ] Domain DNS records configured (A + wildcard)
- [ ] Cloudflare SSL set to Full (strict)
- [ ] All environment variables set in `docker/.env`
- [ ] No default passwords remain (`CHANGE_ME_*` replaced)
- [ ] CORS_ORIGINS lists all app domains
- [ ] SMTP configured and tested
- [ ] Database migrations applied
- [ ] Database seeded (admin user, subscription plans)
- [ ] Health checks passing for all services
- [ ] Backup strategy in place for PostgreSQL volumes
- [ ] Log monitoring configured
