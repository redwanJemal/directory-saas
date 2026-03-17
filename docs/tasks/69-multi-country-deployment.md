# Task 69: Multi-Country Deployment

## Summary
Set up per-country routing and deployment. Each country gets its own subdomain (ae.habeshahub.com, sa.habeshahub.com) with localized defaults.

## Required Changes
- Country-aware routing: subdomain or path-based (/ae/, /sa/)
- Default country selection based on Cloudflare CF-IPCountry header
- Country-specific default filters in search
- Country landing pages with local stats and featured businesses
- Traefik routing configuration for per-country subdomains
- Docker compose updates for multi-country deployment

## Acceptance Criteria
- [ ] Country detection from IP/header
- [ ] Country-specific defaults in search
- [ ] Country landing pages work
- [ ] Deployment supports multiple country subdomains
