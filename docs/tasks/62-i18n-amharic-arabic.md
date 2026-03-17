# Task 62: i18n — Amharic & Arabic

## Summary
Add full Amharic and Arabic translations across all three frontend apps. Implement RTL support for Arabic. Ensure language switcher works and persists preference.

## Required Changes

### 62.1 Translation Files

**Web App** (`apps/web/src/i18n/`):
- Update `en.json` with all new Habesha Hub strings
- Create/update `am.json` with full Amharic translations
- Create `ar.json` with Arabic translations

**Key translation areas:**
- Navigation (Search, Categories, Deals, Cities)
- Homepage (hero, featured, deals section)
- Search (filters, sort options, empty states)
- Business profile (all sections, hours, reviews)
- Auth (login, register, forgot password)
- Common (buttons, labels, errors, pagination)

### 62.2 Amharic Translations (priority)
All UI strings in Amharic. Examples:
- "Find Ethiopian Businesses Near You" → "በአቅራቢያዎ ያሉ ኢትዮጵያዊ ንግዶችን ያግኙ"
- "Search" → "ፈልግ"
- "Categories" → "ምድቦች"
- "Deals" → "ቅናሾች"
- "Write a Review" → "ግምገማ ይጻፉ"
- "Verified Business" → "የተረጋገጠ ንግድ"
- "Open Now" → "አሁን ክፍት ነው"
- "WhatsApp" → "ዋትስአፕ"

### 62.3 Arabic Translations
Basic Arabic translations for Gulf audience. RTL layout support.

### 62.4 RTL Support
- Add `dir="rtl"` when Arabic is selected
- Ensure Tailwind CSS RTL utilities work (use logical properties)
- Test all pages in RTL mode
- Sidebar, forms, cards should flip correctly

### 62.5 Language Switcher
- Header language switcher: EN | አማ | عر
- Persist language choice in localStorage
- Location data (countries, cities) returned in selected language

### 62.6 Provider Portal & Admin
- Same 3 languages in provider portal and admin
- Admin strings: verification, moderation, analytics terms

## Acceptance Criteria
- [ ] Full Amharic translations for all web app pages
- [ ] Arabic translations with RTL layout support
- [ ] Language switcher persists preference
- [ ] All three apps support language switching
- [ ] RTL layout renders correctly for Arabic
- [ ] Location names shown in selected language
