# Task 56: Branding & Theme — Habesha Hub

## Summary
Rebrand all three frontend apps from generic "Directory SaaS" to "Habesha Hub". Update colors, logo, favicon, page titles, meta tags, and default content.

## Required Changes

### 56.1 Brand Identity
- **Name**: Habesha Hub (ሃበሻ ሁብ)
- **Tagline**: "Find Ethiopian Businesses Near You" / "በአቅራቢያዎ ያሉ ኢትዮጵያዊ ንግዶችን ያግኙ"
- **Primary Color**: Deep green (#166534) — Ethiopian flag
- **Accent Colors**: Gold (#ca8a04), Red (#dc2626) — Ethiopian flag accents
- **Brand Hue**: Update VITE_BRAND_HUE to match green-based theme

### 56.2 All Apps
- Update `<title>` tags and `manifest.json`
- Generate favicon with "HH" monogram in brand green
- Update OG meta tags (og:title, og:description, og:image)
- Replace "Directory SaaS" text with "Habesha Hub" everywhere
- Update brand logo component to show "HH" monogram + "Habesha Hub" text

### 56.3 Web App (apps/web)
- Update hero section text: "Find Ethiopian Businesses Near You"
- Update footer with Habesha Hub branding
- Replace generic vendor language with "business" (not "vendor")

### 56.4 Admin App (apps/admin)
- Update sidebar title: "Habesha Hub Admin"
- Update login page: "Admin Dashboard" with brand colors

### 56.5 Provider Portal (apps/provider-portal)
- Update to "Business Dashboard"
- Welcome text: "Manage your Habesha Hub listing"

### 56.6 Docker/Environment
- Update `.env` BRAND_NAME and BRAND_HUE
- Update docker-compose build args

## Acceptance Criteria
- [ ] All three apps show "Habesha Hub" branding
- [ ] Brand colors are Ethiopian green/gold/red
- [ ] Page titles and meta tags updated
- [ ] No remaining "Directory SaaS" text in UI
- [ ] All apps build successfully
