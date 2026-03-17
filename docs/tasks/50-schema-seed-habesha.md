# Task 50: Schema & Seed — Habesha Hub Domain

## Summary
Extend the existing Prisma schema to support Ethiopian business directory features: hierarchical categories with Ethiopian business types, country/city location data, multi-category tagging, WhatsApp contact, business hours, and deals/promotions. Seed with real Ethiopian business categories and demo businesses.

## Current State
- Base schema exists with: ProviderProfile, ProviderPackage, ProviderFaq, PortfolioItem, ProviderAvailability, Category, Booking, Review, etc.
- Generic "directory" categories seeded
- No country/city support, no multi-category, no WhatsApp fields, no deals model

## Required Changes

### 50.1 Prisma Schema Updates

**Extend ProviderProfile** — add these fields:
```prisma
country       String?                    // UAE, Saudi Arabia, etc.
city          String?                    // Dubai, Abu Dhabi, etc.
whatsapp      String?                    // WhatsApp number (international format)
instagram     String?                    // Instagram handle
tiktok        String?                    // TikTok handle
isVerified    Boolean  @default(false)   // (already exists)
verifiedAt    DateTime?                  // When verified
businessHours Json     @default("{}") @map("business_hours")  // { mon: { open: "09:00", close: "22:00" }, ... }
```

**Create ProviderCategory** — many-to-many join table:
```prisma
model ProviderCategory {
  id                String   @id @default(uuid()) @db.Uuid
  providerProfileId String   @map("provider_profile_id") @db.Uuid
  categoryId        String   @map("category_id") @db.Uuid
  isPrimary         Boolean  @default(false) @map("is_primary")
  createdAt         DateTime @default(now()) @map("created_at") @db.Timestamptz

  providerProfile ProviderProfile @relation(fields: [providerProfileId], references: [id], onDelete: Cascade)
  category        Category        @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@unique([providerProfileId, categoryId])
  @@index([categoryId])
  @@map("provider_categories")
}
```

**Create Deal model**:
```prisma
model Deal {
  id                String    @id @default(uuid()) @db.Uuid
  providerProfileId String    @map("provider_profile_id") @db.Uuid
  title             String
  description       String?
  discountPercent   Int?      @map("discount_percent")
  originalPrice     Decimal?  @map("original_price") @db.Decimal(12, 2)
  dealPrice         Decimal?  @map("deal_price") @db.Decimal(12, 2)
  imageUrl          String?   @map("image_url")
  isActive          Boolean   @default(true) @map("is_active")
  startsAt          DateTime? @map("starts_at") @db.Timestamptz
  expiresAt         DateTime? @map("expires_at") @db.Timestamptz
  createdAt         DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt         DateTime  @updatedAt @map("updated_at") @db.Timestamptz

  providerProfile ProviderProfile @relation(fields: [providerProfileId], references: [id], onDelete: Cascade)

  @@index([providerProfileId])
  @@index([isActive, expiresAt])
  @@map("deals")
}
```

**Update Category** — add icon and color:
```prisma
  icon        String?   // Lucide icon name (e.g., "utensils", "scissors")
  color       String?   // Hex color for category badge
```

**Add relations** to ProviderProfile:
```prisma
  categories  ProviderCategory[]
  deals       Deal[]
```

**Add relation** to Category:
```prisma
  providers   ProviderCategory[]
```

### 50.2 Migration
- Create migration: `add_habesha_hub_domain`
- Must be compatible with existing data

### 50.3 Seed Data

**Categories** — seed hierarchical categories for Ethiopian businesses:

```typescript
const categories = [
  // Food & Drink
  { name: 'Food & Drink', slug: 'food-drink', icon: 'utensils', color: '#ef4444', children: [
    { name: 'Restaurant', slug: 'restaurant', icon: 'chef-hat' },
    { name: 'Catering', slug: 'catering', icon: 'cooking-pot' },
    { name: 'Home Cook', slug: 'home-cook', icon: 'home' },
    { name: 'Grocery & Spices', slug: 'grocery-spices', icon: 'shopping-basket' },
    { name: 'Bakery & Sweets', slug: 'bakery-sweets', icon: 'cake' },
    { name: 'Coffee & Cafe', slug: 'coffee-cafe', icon: 'coffee' },
  ]},
  // Beauty & Grooming
  { name: 'Beauty & Grooming', slug: 'beauty-grooming', icon: 'scissors', color: '#ec4899', children: [
    { name: 'Salon', slug: 'salon', icon: 'sparkles' },
    { name: 'Barber', slug: 'barber', icon: 'scissors' },
    { name: 'Braiding & Hair', slug: 'braiding-hair', icon: 'ribbon' },
    { name: 'Henna & Makeup', slug: 'henna-makeup', icon: 'palette' },
    { name: 'Cosmetics Shop', slug: 'cosmetics-shop', icon: 'shopping-bag' },
  ]},
  // Services
  { name: 'Services', slug: 'services', icon: 'briefcase', color: '#3b82f6', children: [
    { name: 'PRO & Typing Center', slug: 'pro-typing', icon: 'file-text' },
    { name: 'Translation', slug: 'translation', icon: 'languages' },
    { name: 'Money Transfer', slug: 'money-transfer', icon: 'banknote' },
    { name: 'Travel Agency', slug: 'travel-agency', icon: 'plane' },
    { name: 'Cargo & Shipping', slug: 'cargo-shipping', icon: 'package' },
    { name: 'Legal & Labor', slug: 'legal-labor', icon: 'scale' },
    { name: 'Real Estate', slug: 'real-estate', icon: 'building' },
  ]},
  // Automotive
  { name: 'Automotive', slug: 'automotive', icon: 'car', color: '#f59e0b', children: [
    { name: 'Mechanic & Garage', slug: 'mechanic-garage', icon: 'wrench' },
    { name: 'Car Wash', slug: 'car-wash', icon: 'droplets' },
    { name: 'Driving School', slug: 'driving-school', icon: 'graduation-cap' },
  ]},
  // Health & Wellness
  { name: 'Health & Wellness', slug: 'health-wellness', icon: 'heart-pulse', color: '#22c55e', children: [
    { name: 'Traditional Medicine', slug: 'traditional-medicine', icon: 'leaf' },
    { name: 'Massage & Spa', slug: 'massage-spa', icon: 'flower' },
    { name: 'Clinic & Pharmacy', slug: 'clinic-pharmacy', icon: 'stethoscope' },
  ]},
  // Shopping
  { name: 'Shopping', slug: 'shopping', icon: 'shopping-cart', color: '#8b5cf6', children: [
    { name: 'Clothing & Fashion', slug: 'clothing-fashion', icon: 'shirt' },
    { name: 'Electronics', slug: 'electronics', icon: 'smartphone' },
    { name: 'Furniture', slug: 'furniture', icon: 'sofa' },
    { name: 'General Trading', slug: 'general-trading', icon: 'store' },
  ]},
  // Community
  { name: 'Community', slug: 'community', icon: 'users', color: '#06b6d4', children: [
    { name: 'Church & Mosque', slug: 'church-mosque', icon: 'landmark' },
    { name: 'Community Center', slug: 'community-center', icon: 'building-2' },
    { name: 'Tutoring & Education', slug: 'tutoring-education', icon: 'book-open' },
    { name: 'Events & Entertainment', slug: 'events-entertainment', icon: 'music' },
  ]},
];
```

**Demo Businesses** — seed 5-8 realistic demo businesses across Dubai/Abu Dhabi:
- "Habesha Kitchen" — Restaurant + Catering + Grocery (Dubai, Deira)
- "Queen Beauty Salon" — Salon + Braiding + Cosmetics (Dubai, Bur Dubai)
- "Abyssinia Travel" — Travel Agency + Cargo (Sharjah)
- "Selam PRO Services" — PRO + Translation + Legal (Abu Dhabi)
- "Addis Auto Care" — Mechanic + Car Wash (Dubai, Al Quoz)

Each with: profile, 2-3 categories, packages, FAQs, business hours, WhatsApp number.

### 50.4 Update DTOs

Update the search/provider DTOs to include the new fields:
- `country`, `city`, `whatsapp` in provider response DTOs
- `categories` array (with id, name, slug, isPrimary) in provider response
- `deals` in provider detail response

### 50.5 Tests
- Update existing provider/search tests to account for new fields
- Add seed validation test (all categories exist, demo businesses created)

## Acceptance Criteria
- [ ] Schema migration applies cleanly
- [ ] `npx prisma db seed` creates all categories and demo businesses
- [ ] Provider search API returns country, city, categories
- [ ] `npm run build` passes with 0 errors
- [ ] `npm test` passes
