# Task 51: Multi-Category Tagging

## Summary
Implement the full multi-category system allowing businesses to tag themselves with multiple categories (e.g., a restaurant that also does catering and sells groceries). Build the API endpoints, update search to filter by category, and ensure the provider portal supports selecting multiple categories.

## Current State
- ProviderCategory join table created in Task 50
- Categories seeded with hierarchical structure
- Existing search returns providers but doesn't filter by multiple categories

## Required Changes

### 51.1 Backend — Category Assignment API

**Add to ProvidersController** (`/api/v1/providers/me/categories`):
- `GET /me/categories` — list current business's categories
- `PUT /me/categories` — set all categories at once (replace strategy)
  - Body: `{ categoryIds: string[], primaryCategoryId: string }`
  - Validates: at least 1 category, max 5 categories, primaryCategoryId must be in the list
- Categories are always set as a whole (not add/remove individually)

**DTOs**:
```typescript
const SetCategoriesSchema = z.object({
  categoryIds: z.array(z.string().uuid()).min(1).max(5),
  primaryCategoryId: z.string().uuid(),
});
```

### 51.2 Backend — Search by Category

**Update SearchProvidersController** (`/api/v1/search/providers`):
- Add `category` query param — filter by category slug (single or comma-separated)
- Add `categoryId` query param — filter by category UUID
- When filtering by parent category (e.g., `food-drink`), include all child categories
- Return `categories` array in each search result item

**Update provider detail endpoint**:
- Include full categories array with `{ id, name, slug, icon, color, isPrimary }`

### 51.3 Backend — Category API Enhancements

**Update CategoriesController** (`/api/v1/categories`):
- `GET /` — return hierarchical tree (parent + children), include provider count per category
- Add `withCount=true` query param to include count of active providers per category

### 51.4 Service Layer

**ProvidersService**:
- `setCategories(tenantId, categoryIds, primaryCategoryId)` — upsert categories
- Include categories in `findOne` and `search` queries via Prisma include

**CategoriesService**:
- `getCategoryTree()` — return nested structure with counts
- `getCategoryBySlug(slug)` — resolve parent/child for search filtering

### 51.5 Tests
- Unit tests for category assignment (min 1, max 5, primary must be in list)
- Unit tests for search filtering by category (parent includes children)
- Unit tests for category tree with provider counts

## Acceptance Criteria
- [ ] Business can set 1-5 categories via PUT endpoint
- [ ] Primary category is marked and returned first in lists
- [ ] Search filters by category slug (parent includes children)
- [ ] Category tree endpoint returns provider counts
- [ ] `npm run build` passes, `npm test` passes
