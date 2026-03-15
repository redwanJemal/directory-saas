# Wedding Directory & Planner SaaS — Product Plan

## Executive Summary

Build an AI-first wedding directory and event planning platform for **Ethiopia and the Ethiopian diaspora**. Help couples in Addis Ababa plan their multi-day celebrations, and help diaspora Ethiopians in DC, Seattle, Dallas, London, and Dubai coordinate weddings in Ethiopia remotely — solving the massive pain of cross-border vendor discovery, trust, and coordination.

**Target market:**
- **Primary:** Urban Ethiopian couples (Addis Ababa, Hawassa, Bahir Dar, Dire Dawa)
- **Secondary:** Ethiopian diaspora (DC metro: 200K+, Seattle, Minneapolis, Dallas, LA, London, Dubai, Israel) planning weddings in Ethiopia
- **Tertiary:** Diaspora couples planning Ethiopian-style weddings abroad

**Why now:**
- No dominant digital platform exists — **Leserge** (the only competitor) has served ~100 couples
- 107 million mobile money accounts in Ethiopia (Telebirr alone: 52-72M users)
- $7.17B in annual diaspora remittances — significant portion goes to family events
- Telegram is the #1 platform in Ethiopia — natural distribution channel
- Ethiopian weddings are complex multi-day events (Shimgelena → Telosh → Ceremony → Mels → Kelekel) that desperately need coordination tools

**Key insight:** Ethiopian weddings are fundamentally different from Western weddings — they're family-driven, multi-day, multi-ceremony affairs with 200-1000+ guests. No Western platform (The Knot, Zola, etc.) understands this. And no Ethiopian platform has modern tech, AI, or diaspora support.

---

## Market Analysis

### Ethiopian Wedding Industry

| Segment | Cost Range (ETB) | Cost Range (USD) |
|---------|-----------------|------------------|
| Budget wedding | 90,000 - 150,000 | $580 - $970 |
| Medium (100-150 guests) | 250,000 - 350,000 | $1,600 - $2,250 |
| Premium / diaspora | 500,000 - 5,000,000+ | $3,200 - $32,000+ |

**Peak seasons:** September (post-Meskel), January-March

**Current vendor marketing channels:** Instagram (90% of brides), Facebook, Telegram channels, word of mouth

### Ethiopian Diaspora

| Location | Estimated Population |
|----------|---------------------|
| Washington DC metro | 100,000 - 200,000+ |
| Seattle-Tacoma | 25,000 - 40,000 |
| Minneapolis-St. Paul | Significant |
| Dallas-Fort Worth | Significant |
| Los Angeles | Growing |
| London, UK | Significant |
| Israel | Large Ethiopian Jewish community |
| Dubai / Middle East | Growing |

**Diaspora pain points planning weddings in Ethiopia:**
1. Finding and vetting vendors remotely — relies on word of mouth and Instagram DMs
2. Trust and accountability — hard to verify quality from thousands of miles away
3. Currency and payments — 78% of remittances go through informal channels (hawala)
4. Time zone coordination — managing vendors across 8-12 hour time differences
5. Cultural authenticity — blending Ethiopian + Western traditions
6. Shipping logistics — traditional attire (habesha kemis) sourcing from abroad

### Existing Competition in Ethiopia

| Platform | Status |
|----------|--------|
| **Leserge** (leserge.net) | Only dedicated wedding marketplace, ~100 couples served, basic features |
| **HabeshaLink** | Content + directory hybrid, blog-focused |
| **AllAddisEvents** | Venue listings only |
| **AddisVenues** | Venue listings with pricing |
| **Instagram/Telegram** | Where most vendor discovery actually happens |

**The gap is enormous.** There is no Ethiopian equivalent of The Knot — no comprehensive directory, no planning tools, no booking system, no AI.

---

## How Our Boilerplate Maps to the Ethiopian Wedding Domain

| Boilerplate Concept | Ethiopian Wedding Domain |
|---------------------|------------------------|
| **Tenant** | Wedding vendor (photographer, venue, caterer, habesha kemis designer, etc.) |
| **TenantUser** | Vendor team (owner, staff, coordinator) |
| **ClientUser** | Couple (+ partner, family members as collaborators) |
| **AdminUser** | Platform operator |
| **Subscription Plans** | Vendor tiers: Free / Pro (ETB 2,000/mo) / Premium (ETB 5,000/mo) |
| **RBAC Roles** | Vendor team: OWNER, ADMIN, MANAGER, MEMBER |
| **Multi-tenancy + RLS** | Vendor data isolation |
| **Meilisearch** | Vendor search with geo (Addis neighborhoods, cities), Amharic support |
| **pgvector** | Semantic search in Amharic + English |
| **BullMQ** | Telegram notifications, RSVP reminders, payment alerts |
| **Vercel AI SDK** | AI planner with Ethiopian wedding knowledge |
| **File uploads (MinIO)** | Vendor portfolios, wedding photos |
| **Event system** | Multi-ceremony coordination (Telosh, ceremony, Mels, Kelekel) |

---

## Ethiopian Wedding Ceremonies — Our UX Framework

Ethiopian weddings are NOT a single-day event. Our platform must coordinate the full multi-day journey:

```
SHIMGELENA (Formal Negotiation)
  → Elders from groom's family visit bride's family
  → Family negotiations and blessings
  → Platform: Elder/family contact management, negotiation timeline

TELOSH (Bridal Shower / Gift Ceremony — 2 days before)
  → Groom's family showers bride with jewelry, gold, clothing
  → At bride's family home
  → Platform: Gift tracking, event coordination

WEDDING DAY
  → Groom's arrival ceremony (song and playful negotiation at door)
  → Knee-kissing ceremony (elder blessings)
  → Religious ceremony:
    - Orthodox: 2-3 hours, incense, chanting, crowning (king & queen)
    - Muslim: Nikah before imam, henna ceremony
    - Traditional: Ethnic-specific rituals
  → Reception: ring exchange, cake, gursha (feeding), eskista dancing
  → Platform: Day-of timeline, vendor coordination, live photo sharing

MELS/MELSI (Day 2)
  → Smaller reception hosted by bride's family
  → Couple wears Kaba (traditional garment)
  → Bride receives new name from mother
  → Platform: Separate event management, guest sub-lists

KELEKEL (Day 3)
  → Extended gathering for those who couldn't attend the wedding
  → Fresh food preparation (sheep)
  → Introductions of all guests
  → Platform: Extended guest management, overflow coordination
```

**Critical difference from Western platforms:** We need per-event RSVP, per-event guest lists, per-event budgets, and per-event vendor assignments — not a single "wedding day" model.

---

## Feature Specification

### Phase 1: Core Directory & Planning (MVP)

#### 1.1 Vendor Directory

**Ethiopian-Specific Categories:**

| Tier | Categories |
|------|-----------|
| **Essential** | Wedding Halls/Venues, Wedding Planners/Coordinators, Photographers, Videographers, Caterers (Ethiopian cuisine specialists) |
| **Cultural** | Habesha Kemis/Traditional Dress Designers, Coffee Ceremony Services, Henna/Body Art, Traditional Music/Bands (kebero, tsenatsel), Eskista Performers |
| **Core** | Florists/Decorators, DJs/Modern Music, Hair Stylists, Makeup Artists, Cake/Dessert Bakers, Tej (Honey Wine) Suppliers |
| **Enhancement** | Rentals (chairs, tables, tents, shemma fabrics), Lighting/Sound, Transport, Invitation Designers (Ge'ez script + modern) |
| **Specialty** | Jewelers, Bridal Dress Shops, Honeymoon/Travel, Hotels, Religious Officiants (Orthodox priests, Imams) |

**Vendor Profile Page:**
- Hero: business name (Amharic + English), category, location (kebele/subcity in Addis), starting price in ETB, response time
- Portfolio gallery organized by real weddings
- Packages & pricing in ETB (with USD equivalent for diaspora)
- Availability calendar
- Reviews (verified, with photo reviews from real weddings)
- Languages spoken (Amharic, Oromiffa, Tigrinya, English)
- "Works with diaspora couples" badge
- Telegram/Instagram links
- FAQ section

**Search & Filtering:**
- Location: Addis Ababa subcities (Bole, Kirkos, Yeka, etc.), other cities, distance radius
- Category with subcategories
- Budget range (ETB slider with USD toggle for diaspora)
- Wedding date / availability
- Style tags: traditional, modern, fusion, Orthodox, Muslim
- Language spoken
- "Diaspora-friendly" filter
- Amharic + English search support
- Map view with Addis Ababa neighborhoods

#### 1.2 Multi-Ceremony Event Management

Unlike Western platforms with a single "wedding day," we support the full Ethiopian wedding structure:

```typescript
// WeddingEvent types for Ethiopian weddings
enum EventType {
  SHIMGELENA,    // Formal family negotiation
  TELOSH,        // Bridal shower / gift ceremony
  CEREMONY,      // Church/mosque/civil ceremony
  RECEPTION,     // Main reception
  MELS,          // Day 2 — bride's family gathering
  KELEKEL,       // Day 3 — extended gathering
  REHEARSAL,     // Rehearsal
  HENNA_NIGHT,   // Henna ceremony (Muslim weddings)
  CUSTOM,        // User-defined events
}
```

- Each event has its own guest list, RSVP tracking, timeline, venue, and budget
- Guests can be invited to specific events (not everyone attends all 3+ days)
- Per-event vendor assignments (different caterer for Mels vs Reception)

#### 1.3 Booking & Inquiry Flow

Same state machine as before, but with Ethiopian-specific additions:
- Inquiry includes: wedding type (Orthodox, Muslim, traditional, fusion), number of events/days, estimated total guest count across all events
- Vendor quotes in ETB with optional USD display
- Telegram notification integration (vendors check Telegram, not email)
- Family member can inquire on behalf of couple (common in Ethiopian culture)

#### 1.4 Review System

- Verified reviews only (booked through platform or wedding date confirmed)
- Photo reviews with real wedding photos
- Subcategory ratings: Quality, Value, Punctuality (critical in Ethiopia), Professionalism, Communication
- **Amharic + English reviews supported**
- Vendor response to each review
- Reviews cannot be removed by vendors
- "Diaspora-verified" badge for reviews from diaspora couples

#### 1.5 Guest List & RSVP

Ethiopian weddings have unique guest management needs:
- **Large guest counts** (200-1000+) — must handle scale
- **Per-event invitations** — Telosh (small), Ceremony (large), Mels (medium), Kelekel (overflow)
- **Family-side tracking** — bride's family, groom's family, mutual, work colleagues
- **Group/household management** — entire families invited together
- **No plus-one concept** — Ethiopian weddings invite families, not individuals
- **RSVP via Telegram/SMS** — not just web form (many guests won't use a website)
- **Meal tracking** — dietary needs less relevant (everyone eats injera + wot), but head count is critical for caterer
- **Table group preferences** — which families/groups should sit together
- **Dashboard:** attending per event, total meal count for caterer, overflow management

#### 1.6 Budget Tracker

**Ethiopian-specific default categories:**

| Category | Typical % |
|----------|----------|
| Venue/Hall Rental | 15-25% |
| Catering (Ethiopian food + drinks) | 25-35% |
| Photography & Video | 5-10% |
| Traditional Dress (Habesha Kemis, Kaba, Tilf) | 5-10% |
| Music & Entertainment | 5-10% |
| Decorations (shemma, mesob, modern) | 5-10% |
| Flowers | 3-5% |
| Cake & Desserts | 2-5% |
| Tej & Beverages | 3-5% |
| Coffee Ceremony | 1-2% |
| Henna (Muslim weddings) | 1-3% |
| Invitations & Stationery | 1-2% |
| Transport | 2-3% |
| Rings & Jewelry | 3-5% |
| Gifts (Telosh) | 5-10% |
| Miscellaneous | 5% |

- **Dual currency display** — ETB primary, USD equivalent for diaspora
- **"Who's paying" is complex** — bride's family, groom's family, both families, couple, diaspora relatives
- **Remittance tracking** — diaspora family members sending money for specific budget items
- **Per-event budgets** — separate budgets for Telosh, wedding day, Mels, Kelekel

#### 1.7 Wedding Checklist

**Ethiopian wedding timeline template (adapted from 12-month Western model):**

```
6-12 Months Before:
  □ Begin Shimgelena process (elder negotiations)
  □ Set total budget with both families
  □ Determine guest count (across all events)
  □ Research and book wedding hall/venue
  □ Hire wedding planner/coordinator
  □ Book photographer and videographer

3-6 Months Before:
  □ Book caterer (Ethiopian cuisine)
  □ Order habesha kemis and groom's attire
  □ Book traditional and modern music/DJ
  □ Arrange coffee ceremony service
  □ Book hair and makeup
  □ Order wedding cake
  □ Arrange Tej supplier
  □ Book decorators
  □ Plan Telosh details

1-3 Months Before:
  □ Send invitations (physical + Telegram broadcast)
  □ Book henna artist (Muslim weddings)
  □ Confirm all vendor details
  □ Finalize menu with caterer (injera varieties, wot selection, kitfo)
  □ Plan ceremony details with priest/imam
  □ Arrange transport
  □ Order rings and Telosh gifts
  □ Confirm venue for Mels and Kelekel

Final Month:
  □ Confirm final guest count per event
  □ Distribute day-of timeline to vendors
  □ Confirm Kelekel sheep/food arrangements
  □ Final dress fitting
  □ Rehearsal with ceremony officiant
  □ Prepare Kaba for Mels
```

#### 1.8 Messaging & Communication

- **Telegram integration** — send notifications, booking updates, and reminders via Telegram bot (this is where Ethiopian vendors actually communicate)
- WebSocket in-app chat as backup
- Rich messages: text, images, files, voice notes
- **Amharic + English support**
- Vendor quick-reply templates in Amharic
- Auto follow-up nudges
- Family member can message on behalf of couple

---

### Phase 2: Advanced Planning Tools

#### 2.1 Wedding Website Builder

**Ethiopian wedding website sections:**
- Home (couple names in Ge'ez script + English, date in Ethiopian calendar + Gregorian, venue, countdown)
- Our Story (how we met, families' connection)
- Events Schedule (Telosh, Ceremony, Mels, Kelekel — each with time, location, dress code, map)
- Wedding Party (best man/maid of honor + family elders with photos and roles)
- Travel & Accommodations (for diaspora guests: flights to Addis, hotels, visa info, local transport, safety tips)
- RSVP Form (per-event, works via web + Telegram link)
- Photo Gallery
- Registry / Gift Fund (cash fund via Telebirr/bank transfer, not Amazon)
- FAQ (weather, dress code for each event, food info, local customs for non-Ethiopian guests)

**Customization:**
- Ethiopian-inspired themes (Ge'ez patterns, shemma textures, Ethiopian cross motifs, coffee ceremony aesthetics)
- Bilingual content (Amharic/English toggle)
- Ethiopian calendar date display alongside Gregorian
- Password protection

#### 2.2 Seating Chart Builder

Ethiopian weddings have unique seating:
- Very large scale (200-1000+ guests)
- Head table for couple + families + elders
- Family groupings are critical (not just "friend groups")
- Separate sections sometimes for bride's side and groom's side
- Standing/overflow areas common for Kelekel
- Must handle Ethiopian naming conventions

#### 2.3 Day-of Timeline Builder

Ethiopian wedding day timeline is different:

```
Groom's House: Getting ready, family prayers
  ↓
Groom's Entourage: Drive to bride's home (convoy with horns)
  ↓
Bride's Door: Arrival ceremony (song, playful refusal, entry)
  ↓
Bride's Home: Couple meets, flowers presented
  ↓
Church/Mosque: Religious ceremony (2-3 hours for Orthodox)
  ↓
Knee-Kissing: Elder blessings at venue entrance
  ↓
Reception Hall: Grand entrance, ring exchange, cake cutting
  ↓
Gursha: Couple feeds each other (symbolic)
  ↓
Dinner: Injera spread, doro wot, kitfo
  ↓
Coffee Ceremony: Three rounds (Abol, Tona, Bereka)
  ↓
Eskista & Dancing: Traditional + modern music
  ↓
Late Night: Celebration continues
```

- Day 2 (Mels) and Day 3 (Kelekel) have their own timelines
- Vendor assignments per timeline block

#### 2.4 Mood Boards / Inspiration

- Curated Ethiopian wedding inspiration galleries
- Categories: traditional dress styles, Ethiopian decor (shemma, mesob), color palettes, modern-fusion ideas
- Share with vendors via Telegram
- "Get This Look" linking to vendors on the platform

---

### Phase 3: AI Features (The Differentiator)

#### 3.1 AI Vendor Matching

- Style quiz adapted for Ethiopian weddings: Orthodox/Muslim/traditional/fusion, traditional vs modern aesthetic, indoor vs outdoor, guest count scale
- AI understands Ethiopian wedding categories and cultural requirements
- "Diaspora-friendly vendor" matching for remote planning
- Budget matching in ETB with local market intelligence
- Examples:
  - "Find me a traditional caterer in Bole that can handle 500 guests and has experience with diaspora weddings"
  - "Show me habesha kemis designers with modern fusion styles under ETB 50,000"

#### 3.2 AI Budget Optimizer

- Ethiopian market-specific benchmarks (not US/UK averages)
- Local price intelligence from platform vendor data
- Multi-event budget allocation (Telosh + ceremony + Mels + Kelekel)
- Diaspora currency optimization: "Send ETB equivalent via Telebirr for catering, pay photographer in USD"
- "What if" scenarios: "Add a Kelekel day?" "Upgrade to Sheraton from a smaller hall?"

#### 3.3 AI Seating Solver

- Handles large Ethiopian wedding scale (500+ guests)
- Understands Ethiopian family structure: bride's family, groom's family, elders' table, family friends
- Cultural constraints: elder positioning, family hierarchy
- Runs as BullMQ job for large guest counts

#### 3.4 AI Planning Assistant (Chat)

- **Bilingual:** Understands and responds in Amharic and English
- **Culturally aware:** Knows Ethiopian wedding traditions, ceremonies, etiquette
- System prompt includes Ethiopian wedding expertise:
  - Shimgelena customs and protocol
  - Orthodox/Muslim ceremony requirements
  - Traditional food and drink (injera varieties, wot types, tej, coffee ceremony)
  - Habesha kemis styles and pricing
  - Ethiopian calendar conversions
  - Diaspora-specific advice (visa requirements, flights, hotel recommendations in Addis)
- Example conversations:
  - "How many sheep do I need for Kelekel with 300 guests?"
  - "What's the proper Shimgelena protocol for an Orthodox wedding?"
  - "I'm in DC — how do I send money to pay my caterer in Addis?"
  - "Help me plan a timeline for a fusion wedding with both Orthodox ceremony and Western reception"
  - "What are typical photographer prices in Addis right now?"

#### 3.5 AI Content Generation

- **Invitation wording** in Amharic (Ge'ez script) + English
- **Wedding website copy** bilingual
- **Speech/toast suggestions** culturally appropriate
- **Thank-you messages** in Amharic

#### 3.6 Predictive Analytics

- Popular dates: Ethiopian wedding season awareness (September, January-March)
- Venue availability forecasting for Addis Ababa halls
- Budget predictions based on local vendor pricing data
- Guest attendance predictions (Ethiopian weddings have very high attendance rates)

---

## Internationalization (i18n) Strategy

| Aspect | Implementation |
|--------|---------------|
| **Languages** | Amharic (primary), English (diaspora), Oromiffa, Tigrinya (phase 2) |
| **Script** | Ge'ez (Fidel) support throughout — fonts, input, display |
| **Calendar** | Ethiopian calendar (13 months) alongside Gregorian — date picker shows both |
| **Currency** | ETB primary, USD/EUR/GBP toggle for diaspora users |
| **Phone format** | Ethiopian (+251) format, international format for diaspora |
| **Addresses** | Ethiopian format: subcity/kebele/woreda system in Addis |
| **Names** | Ethiopian naming convention (given name + father's name, no surname) |
| **Number format** | Ethiopian/international toggle |
| **RTL** | Not needed (Ge'ez is LTR) |

**Research shows:** An Ethiopian e-commerce site that added Amharic/Oromiffa/Tigrinya saw a **40% boost in conversion rates**. Language localization is not optional.

---

## Payment & Currency Strategy

### For Couples (Free)

All planning tools are free for couples. No payment required.

### For Vendors (Subscriptions)

| Tier | Price (ETB/mo) | Price (USD equiv.) | Features |
|------|---------------|-------------------|----------|
| **Free** | 0 | $0 | Basic profile, 10 photos, 5 inquiries/mo |
| **Pro** | 2,000 | ~$13 | 50 photos, unlimited inquiries, analytics |
| **Premium** | 5,000 | ~$32 | Unlimited everything, featured badge, AI lead scoring |

**Payment methods (vendors):**
- **Telebirr** — primary (52-72M users)
- **CBE Birr** — Commercial Bank of Ethiopia mobile
- **Bank transfer** — direct to Ethiopian bank account
- **Amole / HelloCash** — alternative mobile money
- **Stripe** — for diaspora vendors paying in USD/EUR

**Note:** Pricing is dramatically lower than US platforms ($49-149/mo) because of Ethiopian market purchasing power. ETB 2,000/mo (~$13) is accessible for established vendors in Addis.

### For Diaspora-to-Ethiopia Payments

- **Telebirr International Remittance** integration for sending payments to vendors
- **WorldRemit** / **Remitly** links for diaspora money transfers
- Display real-time ETB/USD exchange rate on all price displays
- Track which budget items are paid locally vs. from abroad

---

## Data Model Additions (Ethiopian-Specific)

Beyond the base data model, these Ethiopian-specific additions:

```
VendorProfile additions:
  - subcity          String?      // Addis subcity (Bole, Kirkos, Yeka, etc.)
  - woreda           String?      // Woreda/kebele
  - telegramHandle   String?      // Primary communication channel
  - diasporaFriendly Boolean      // Works with remote clients
  - weddingTypes     String[]     // ["orthodox", "muslim", "traditional", "fusion", "civil"]
  - priceETB         Decimal      // Primary price in ETB
  - priceUSD         Decimal?     // Optional USD equivalent

Wedding additions:
  - weddingType      WeddingType  // ORTHODOX, MUSLIM, TRADITIONAL, FUSION, CIVIL
  - ethiopianDate    String?      // Ethiopian calendar date
  - familyContacts   Json         // Elder contacts for Shimgelena

WeddingEvent additions:
  - Ethiopian event types: SHIMGELENA, TELOSH, HENNA_NIGHT, MELS, KELEKEL

BudgetItem additions:
  - currencyPaid     String       // ETB or USD (track which currency was used)
  - paidViaDiaspora  Boolean      // Was this paid from abroad?
  - remittanceRef    String?      // Telebirr/WorldRemit reference

Guest additions:
  - invitedEvents    String[]     // Which of the multi-day events they're invited to
  - familyGroup      String?      // Extended family group name
  - isElder          Boolean      // Elder requiring special seating/protocol
```

---

## Telegram Integration Strategy

Telegram is the #1 communication platform in Ethiopia — more important than email, WhatsApp, or SMS.

### Vendor Notifications via Telegram Bot

```
New Inquiry → Telegram message to vendor
  "New wedding inquiry from [Couple Name]
   Date: [Ethiopian date] / [Gregorian date]
   Event type: Orthodox wedding
   Guest count: ~400
   Budget: ETB 500,000
   → View details: [link]"

Quote accepted → Telegram notification
RSVP updates → Daily digest via Telegram
Payment reminders → Telegram message
```

### Guest RSVP via Telegram

Many Ethiopian guests (especially older family members) won't use a web form. Support RSVP via Telegram:

```
Guest receives Telegram link from couple
  → Opens bot conversation
  → "Are you attending [Couple]'s wedding?"
  → Buttons: "Yes, all events" / "Ceremony only" / "Cannot attend"
  → "How many people in your group?"
  → Confirmation message
```

### Distribution

- Telegram channel for the platform (news, featured vendors, wedding inspiration)
- Vendor Telegram groups for industry networking
- Couple can share wedding details via Telegram broadcast

---

## Business Model (Ethiopian Market)

### Revenue Streams

| Stream | Model | Phase |
|--------|-------|-------|
| **Vendor subscriptions** | Free / Pro (ETB 2K/mo) / Premium (ETB 5K/mo) | MVP |
| **Featured listings** | ETB 500-2,000 per month boost | MVP |
| **Booking commissions** | 2-3% on bookings through platform | Phase 2 |
| **Wedding website premium** | ETB 500/mo for custom domain + premium themes | Phase 2 |
| **Diaspora premium** | $9.99/mo for diaspora planning tools (USD pricing) | Phase 2 |
| **Vendor tools** | CRM, contracts, invoicing (ETB 1,000/mo add-on) | Phase 3 |

### Growth Strategy

1. **Seed vendors manually** — onboard top 50 vendors in Addis Ababa personally (photographers, venues, caterers, planners)
2. **Telegram channel** — build audience with Ethiopian wedding inspiration content
3. **Instagram presence** — showcase real weddings, vendor spotlights
4. **Diaspora community partnerships** — Ethiopian churches, cultural centers in DC, Seattle, Dallas
5. **Wedding fair presence** — sponsor/attend Ethiopian wedding expos
6. **Referral program** — couples who refer other couples get premium features free

---

## Implementation Phases

### Phase 1 — MVP (8-10 weeks)

Core directory + planning tools, Amharic + English, Telebirr payments.

**New Modules:**
1. `vendor-categories` — Ethiopian wedding vendor categories + seeding
2. `vendor-profiles` — Profiles with ETB pricing, Telegram, diaspora-friendly badge
3. `vendor-search` — Meilisearch with Addis Ababa geo + Amharic search
4. `weddings` — Multi-ceremony Ethiopian wedding management
5. `bookings` — Inquiry → quote → booking with ETB/USD support
6. `reviews` — Verified reviews in Amharic + English
7. `guests` — Large-scale guest management with per-event invitations
8. `budget` — ETB/USD dual currency, per-event budgets, remittance tracking
9. `checklist` — Ethiopian wedding timeline templates
10. `messaging` — Telegram bot + WebSocket chat

**Frontend:**
- Web app (Amharic + English): vendor search, wedding dashboard, RSVP management
- Provider portal: profile management, booking inbox, availability calendar
- Admin: vendor moderation, category management, platform analytics

**Key technical:**
- Amharic (Ge'ez script) font rendering and input
- Ethiopian calendar date picker (with Gregorian conversion)
- ETB/USD currency toggle
- Telebirr payment integration for vendor subscriptions
- Telegram bot for vendor notifications and guest RSVP

### Phase 2 — Advanced Tools (6-8 weeks)

1. `wedding-websites` — Bilingual website builder with Ethiopian themes
2. `seating` — Large-scale seating chart (500+ guests, elder/family hierarchy)
3. `timeline` — Multi-day timeline (ceremony + Mels + Kelekel)
4. `mood-boards` — Ethiopian wedding inspiration galleries
5. Telegram RSVP bot
6. Diaspora payment flow (Telebirr International / WorldRemit links)
7. Oromiffa + Tigrinya language support

### Phase 3 — AI Features (6-8 weeks)

1. AI vendor matching (culturally-aware, budget-aware in ETB)
2. AI budget optimizer (Ethiopian market benchmarks)
3. AI seating solver (handles 500+ guests, elder hierarchy)
4. AI planning assistant (bilingual Amharic/English, Ethiopian wedding expertise)
5. AI content generation (Amharic invitation wording, Ge'ez script)
6. Predictive analytics (Ethiopian wedding season, venue demand in Addis)

### Phase 4 — Growth (Ongoing)

1. Mobile app (critical — many Ethiopian users are mobile-only)
2. Expand to other Ethiopian cities (Hawassa, Bahir Dar, Dire Dawa, Adama)
3. Christening/baptism support (Kristina — major events in Orthodox culture)
4. Corporate event support
5. Vendor CRM tools (contracts, invoicing)
6. Diaspora-to-Ethiopia logistics coordination (shipping, travel booking)

---

## Beyond Weddings — Platform Expansion

Ethiopian culture is rich with major life events that need coordination:

| Event | Opportunity |
|-------|------------|
| **Kristina** (Christening/Baptism) | Large celebrations in Orthodox families, similar vendor needs |
| **Graduation celebrations** | Growing as education access expands |
| **Engagement parties** | Modern + traditional |
| **Meskel celebrations** | September festival, event coordination |
| **Timket** (Epiphany) | January festival events |
| **Corporate events** | Growing sector in Addis (conferences, launches) |
| **Diaspora community events** | Cultural festivals, fundraisers in DC/Seattle/etc. |

The platform name and branding should be event-agnostic enough to expand beyond weddings.

---

## Key Metrics to Track

| Metric | Target (6 months) |
|--------|-------------------|
| Vendor sign-ups (Addis) | 200+ |
| Couple sign-ups | 500+ |
| Diaspora couple sign-ups | 100+ |
| Inquiry-to-booking rate | >15% |
| Vendor response time | <8 hours (Addis), <24 hours (diaspora inquiries) |
| Telegram bot users | 1,000+ |
| Monthly active couples | >50% of registered |
| Reviews per completed wedding | >1 |
| Vendor churn rate | <5%/mo |

---

## Competitive Advantages

1. **First mover** — no real competition in Ethiopian wedding tech
2. **AI-native** — cultural AI that understands Ethiopian weddings, not a Western platform with a language toggle
3. **Diaspora bridge** — solves the massive pain of planning remotely
4. **Telegram-first** — meets users where they are (not email)
5. **Bilingual** — Amharic + English, Ge'ez script support
6. **Dual currency** — ETB + USD, remittance-aware
7. **Multi-ceremony** — built for 3+ day Ethiopian weddings, not single-day Western events
8. **Honest reviews** — no censorship (major trust gap in Ethiopian market where word-of-mouth is unreliable at scale)
9. **Modern tech** — NestJS + React + PostgreSQL, not WordPress/basic PHP
10. **Expandable** — architecture supports christenings, corporate events, festivals
