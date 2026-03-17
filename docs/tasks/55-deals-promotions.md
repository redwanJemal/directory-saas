# Task 55: Deals & Promotions Module

## Summary
Allow businesses to create time-limited deals and promotions. Deals appear on the main site, in search results, and on business profiles. Expired deals are automatically deactivated.

## Required Changes

### 55.1 Backend — Deals CRUD

**Provider endpoints** (`/api/v1/providers/me/deals`):
- `GET /` — list current business's deals
- `POST /` — create a new deal
- `PATCH /:id` — update a deal
- `DELETE /:id` — soft-delete a deal (set isActive=false)

**Public endpoints** (`/api/v1/deals`):
- `GET /` — list active deals (paginated, filterable by country/city/category)
- `GET /featured` — featured deals (for homepage)
- `GET /:id` — deal detail

### 55.2 DTOs

```typescript
const CreateDealSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  discountPercent: z.number().min(1).max(99).optional(),
  originalPrice: z.number().positive().optional(),
  dealPrice: z.number().positive().optional(),
  startsAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
});
```

### 55.3 Deal Expiry Job

Add a BullMQ recurring job to deactivate expired deals:
- Run daily at midnight
- Set `isActive=false` where `expiresAt < now() AND isActive = true`
- Log count of expired deals

### 55.4 Search Integration
- Include active deal count in provider search results: `{ ...provider, activeDeals: 2 }`
- Add `hasDeals=true` filter to search: return only providers with active deals
- Deals page with filters: country, city, category

### 55.5 Tests
- Unit tests for deals CRUD
- Unit tests for deal expiry job
- Unit tests for search with deals filter

## Acceptance Criteria
- [ ] Businesses can create, update, delete deals
- [ ] Public deals list with filtering by location/category
- [ ] Expired deals automatically deactivated
- [ ] Search results show active deal count
- [ ] `npm run build` passes, `npm test` passes
