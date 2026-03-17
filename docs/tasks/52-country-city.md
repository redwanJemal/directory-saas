# Task 52: Country & City Support

## Summary
Add multi-country and city support for Ethiopian businesses across the Middle East. Implement location-based search, city autocomplete, and country/city filter UI data.

## Current State
- ProviderProfile has `country` and `city` fields from Task 50
- No location filtering in search
- No predefined country/city data

## Required Changes

### 52.1 Backend — Location Constants

Create `backend/src/common/constants/locations.ts`:

```typescript
export const SUPPORTED_COUNTRIES = [
  { code: 'AE', name: 'United Arab Emirates', nameAm: 'ዩናይትድ አረብ ኤሚሬትስ', nameAr: 'الإمارات العربية المتحدة' },
  { code: 'SA', name: 'Saudi Arabia', nameAm: 'ሳዑዲ አረቢያ', nameAr: 'المملكة العربية السعودية' },
  { code: 'KW', name: 'Kuwait', nameAm: 'ኩዌት', nameAr: 'الكويت' },
  { code: 'QA', name: 'Qatar', nameAm: 'ቃታር', nameAr: 'قطر' },
  { code: 'BH', name: 'Bahrain', nameAm: 'ባህሬን', nameAr: 'البحرين' },
  { code: 'OM', name: 'Oman', nameAm: 'ኦማን', nameAr: 'عمان' },
];

export const CITIES: Record<string, Array<{ name: string; nameAm: string; nameAr: string }>> = {
  AE: [
    { name: 'Dubai', nameAm: 'ዱባይ', nameAr: 'دبي' },
    { name: 'Abu Dhabi', nameAm: 'አቡ ዳቢ', nameAr: 'أبو ظبي' },
    { name: 'Sharjah', nameAm: 'ሻርጃ', nameAr: 'الشارقة' },
    { name: 'Ajman', nameAm: 'አጅማን', nameAr: 'عجمان' },
    { name: 'Al Ain', nameAm: 'አል አይን', nameAr: 'العين' },
    { name: 'Ras Al Khaimah', nameAm: 'ራስ አል ኸይማ', nameAr: 'رأس الخيمة' },
    { name: 'Fujairah', nameAm: 'ፉጃይራ', nameAr: 'الفجيرة' },
  ],
  SA: [
    { name: 'Riyadh', nameAm: 'ሪያድ', nameAr: 'الرياض' },
    { name: 'Jeddah', nameAm: 'ጅዳ', nameAr: 'جدة' },
    { name: 'Dammam', nameAm: 'ዳማም', nameAr: 'الدمام' },
    { name: 'Mecca', nameAm: 'መካ', nameAr: 'مكة المكرمة' },
    { name: 'Medina', nameAm: 'መዲና', nameAr: 'المدينة المنورة' },
  ],
  KW: [
    { name: 'Kuwait City', nameAm: 'ኩዌት ሲቲ', nameAr: 'مدينة الكويت' },
    { name: 'Hawalli', nameAm: 'ሀዋሊ', nameAr: 'حولي' },
    { name: 'Farwaniya', nameAm: 'ፋርዋኒያ', nameAr: 'الفروانية' },
  ],
  QA: [
    { name: 'Doha', nameAm: 'ዶሃ', nameAr: 'الدوحة' },
    { name: 'Al Wakrah', nameAm: 'አል ዋክራ', nameAr: 'الوكرة' },
  ],
  BH: [
    { name: 'Manama', nameAm: 'ማናማ', nameAr: 'المنامة' },
    { name: 'Riffa', nameAm: 'ሪፋ', nameAr: 'الرفاع' },
  ],
  OM: [
    { name: 'Muscat', nameAm: 'ሙስካት', nameAr: 'مسقط' },
    { name: 'Salalah', nameAm: 'ሳላላ', nameAr: 'صلالة' },
  ],
};
```

### 52.2 Backend — Location API

**Create LocationsController** (`/api/v1/locations`):
- `GET /countries` — return supported countries
- `GET /countries/:code/cities` — return cities for a country

These are public endpoints (no auth required).

### 52.3 Backend — Search by Location

**Update SearchProvidersController**:
- Add `country` query param — filter by country code (e.g., `AE`)
- Add `city` query param — filter by city name
- Support combined filters: `?country=AE&city=Dubai&category=restaurant`

**Update provider list/search queries**:
- Add `where` clauses for country/city filtering
- Default sort: country-local first (if user's location is known via header/param)

### 52.4 Backend — Provider Profile Updates

**Update provider self-service endpoints**:
- `PATCH /me/profile` should accept `country` and `city` fields
- Validate country code against SUPPORTED_COUNTRIES
- Validate city against CITIES[countryCode]

### 52.5 Tests
- Unit tests for location constants validity
- Unit tests for search filtering by country/city
- Unit tests for profile update with location validation

## Acceptance Criteria
- [ ] GET /locations/countries returns 6 countries with translations
- [ ] GET /locations/countries/AE/cities returns 7 UAE cities
- [ ] Search providers filters by country and city
- [ ] Provider profile update validates country/city
- [ ] `npm run build` passes, `npm test` passes
