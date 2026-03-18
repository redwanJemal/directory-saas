# Task 71: Blog Module — Backend

## Summary
Create a full blog/content management system. Admin creates and publishes articles. Articles are publicly visible on the web app. Content focuses on guides for Ethiopian businesses in the Middle East: business licenses, VAT/tax, country-specific regulations, how-to guides.

## Required Changes

### 71.1 Prisma Schema

**Create BlogPost model**:
```prisma
model BlogPost {
  id            String    @id @default(uuid()) @db.Uuid
  title         String
  slug          String    @unique
  excerpt       String?
  content       String    // Rich text / markdown
  coverImageUrl String?   @map("cover_image_url")
  authorId      String    @map("author_id") @db.Uuid
  authorName    String    @map("author_name")
  categorySlug  String    @map("category_slug") // guide, news, tips, country-guide
  tags          Json      @default("[]") // string array
  country       String?   // Optional country focus (AE, SA, etc.)
  status        String    @default("draft") // draft, published, archived
  publishedAt   DateTime? @map("published_at") @db.Timestamptz
  viewCount     Int       @default(0) @map("view_count")
  readTimeMin   Int       @default(5) @map("read_time_min")
  metaTitle     String?   @map("meta_title")
  metaDescription String? @map("meta_description")
  createdAt     DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt     DateTime  @updatedAt @map("updated_at") @db.Timestamptz

  @@index([status, publishedAt])
  @@index([categorySlug])
  @@index([country])
  @@map("blog_posts")
}
```

### 71.2 Blog Categories (Constants)

Define blog categories as constants (not a DB table):
```typescript
export const BLOG_CATEGORIES = [
  { slug: 'guide', name: 'Business Guides', nameAm: 'የንግድ መመሪያዎች', icon: 'book-open' },
  { slug: 'country-guide', name: 'Country Guides', nameAm: 'የአገር መመሪያዎች', icon: 'map' },
  { slug: 'news', name: 'News & Updates', nameAm: 'ዜናዎች', icon: 'newspaper' },
  { slug: 'tips', name: 'Business Tips', nameAm: 'የንግድ ምክሮች', icon: 'lightbulb' },
  { slug: 'success-story', name: 'Success Stories', nameAm: 'የስኬት ታሪኮች', icon: 'trophy' },
  { slug: 'legal', name: 'Legal & Compliance', nameAm: 'ሕጋዊ', icon: 'scale' },
];
```

### 71.3 Admin Blog API

**AdminBlogController** (`/api/v1/admin/blog`):
- `GET /` — list all posts (paginated, filterable by status/category/country)
- `POST /` — create new post (draft by default)
- `GET /:id` — get post by ID
- `PATCH /:id` — update post
- `DELETE /:id` — delete post
- `PATCH /:id/publish` — publish post (set status=published, publishedAt=now)
- `PATCH /:id/unpublish` — revert to draft

**DTOs** (Zod):
```typescript
const CreateBlogPostSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(10),
  excerpt: z.string().max(300).optional(),
  coverImageUrl: z.string().url().optional(),
  categorySlug: z.enum(['guide', 'country-guide', 'news', 'tips', 'success-story', 'legal']),
  tags: z.array(z.string()).max(10).optional(),
  country: z.string().length(2).optional(),
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
});
```

Auto-generate slug from title (slugify, ensure unique by appending number if needed).
Auto-calculate readTimeMin from content length (~200 words per minute).

### 71.4 Public Blog API

**BlogController** (`/api/v1/blog`):
- `GET /` — list published posts (paginated, filterable by category/country/tag)
- `GET /categories` — list blog categories with post counts
- `GET /featured` — latest 3 published posts
- `GET /:slug` — get single post by slug (increment viewCount)
- `GET /related/:slug` — get 3 related posts (same category or tags)

All public endpoints — no auth required.

### 71.5 Seed Data

Seed 3-5 sample blog posts:
1. "How to Start a Business in the UAE as an Ethiopian" (country-guide, AE)
2. "Understanding VAT in the Gulf Countries" (legal)
3. "Top 5 Tips for Ethiopian Restaurants in Dubai" (tips, AE)
4. "Business License Types in Saudi Arabia" (country-guide, SA)
5. "Success Story: From Home Cook to Restaurant Owner" (success-story)

Each with realistic content (300-500 words), proper excerpts, tags, and cover image placeholders.

### 71.6 Tests
- Unit tests for blog service (CRUD, publish/unpublish, slug generation, view count)
- Unit tests for DTO validation
- Unit tests for public listing with filters

## Acceptance Criteria
- [ ] BlogPost model created and migrated
- [ ] Admin CRUD with publish/unpublish flow
- [ ] Public listing with category/country filters
- [ ] Slug auto-generation with uniqueness
- [ ] View count incremented on read
- [ ] Sample posts seeded
- [ ] `npm run build` passes, `npm test` passes
