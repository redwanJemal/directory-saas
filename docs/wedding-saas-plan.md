# Wedding Directory & Planner SaaS — Product Plan

## Executive Summary

Build an AI-first wedding directory and planning platform that solves the two biggest problems in wedding tech: **couples are overwhelmed by decisions** and **vendors are exploited by pay-to-play directories**. We differentiate through AI-powered planning tools, honest reviews, transparent vendor pricing, and a fair business model.

**Target:** The global wedding services market ($414B projected by 2030, 4.8% CAGR).

**Key insight from competitive research:** Every major platform (The Knot: 2.5/5, WeddingWire: 1.3/5, Zola: 1.2/5, Joy: 1.8/5 on Trustpilot) is plagued by review censorship, poor lead quality, and broken tools. Only Bridebook (4.8/5) gets UX right — but lacks AI and is UK-focused. **The gap is wide open for an AI-native platform with honest vendor relationships.**

---

## How Our Boilerplate Maps to Wedding Domain

| Boilerplate Concept | Wedding Domain |
|---------------------|---------------|
| **Tenant** | Wedding Vendor (photographer, venue, caterer, etc.) |
| **TenantUser** | Vendor team members (owner, staff, coordinator) |
| **ClientUser** | Couple (bride, groom, partner) |
| **AdminUser** | Platform operator (us) |
| **Subscription Plans** | Vendor tiers (Free, Pro $49/mo, Premium $149/mo) |
| **RBAC Roles** | Vendor team: OWNER, ADMIN, MANAGER, MEMBER |
| **Multi-tenancy + RLS** | Vendor data isolation (portfolios, bookings, finances) |
| **Meilisearch** | Vendor search with geo, facets, typo-tolerance |
| **pgvector** | Semantic vendor matching ("rustic outdoor venue near mountains") |
| **BullMQ** | Email invites, RSVP reminders, payment alerts, AI tasks |
| **Vercel AI SDK** | AI planner assistant, vendor matching, budget optimizer |
| **File uploads (MinIO)** | Vendor portfolios, wedding photos, mood boards |
| **Event system** | Booking state changes, RSVP notifications, task reminders |

---

## Competitive Landscape Summary

| Platform | Rating | Strength | Fatal Flaw |
|----------|--------|----------|------------|
| **The Knot** | 2.5/5 | Largest US directory, 241K vendors | Review censorship, glitchy tools |
| **WeddingWire** | 1.3/5 | Same ecosystem as The Knot | Worst-rated, 12-month lock-in, fake leads |
| **Zola** | 1.2/5 | Modern design, strong registry | Awful support, print issues, lost gifts |
| **Joy** | 1.8/5 | Free tools, good website builder | Data loss, app crashes, "joy credit" scam |
| **Bridebook** | 4.8/5 | Best UX, great support | UK-focused, no AI, smaller network |
| **Zankyou** | 3.9/5 | Multilingual, international | Hidden fees, account deletions |

### Top 10 Market Gaps We Can Fill

1. **Review integrity** — competitors censor negative reviews to protect paying vendors
2. **Lead quality** — vendors pay $100-400/mo for fake/unresponsive leads
3. **AI-powered planning** — no platform has meaningful AI (budget, matching, seating, chat)
4. **Mobile experience** — every platform except Bridebook has buggy mobile apps
5. **Fair vendor pricing** — pay-per-booking instead of pay-for-visibility
6. **Collaborative planning** — current tools are single-user, but weddings involve 5+ people
7. **Vendor-side tools** — vendors need separate CRM (HoneyBook), no integrated solution
8. **Multicultural support** — no platform handles diverse wedding traditions
9. **Data ownership** — couples lose everything if platform deletes their account
10. **End-to-end journey** — couples use 3-5 tools because no single platform does it all

---

## The Wedding Planning Journey (Our UX Framework)

Couples plan over 12-18 months. Our platform guides them through each phase:

```
Phase 1: Dream & Define (Month 1-2)
  → Style quiz, mood boards, budget calculator, AI recommendations
  → "What kind of wedding do you want?"

Phase 2: Foundation (Month 2-4)
  → Venue search (THE critical decision), planner booking
  → AI: "Based on your style + budget + guest count, here are your top venue matches"

Phase 3: Vendor Assembly (Month 4-8)
  → Book photographer, caterer, florist, DJ, officiant, hair/makeup
  → AI: vendor matching, availability checking, quote comparison

Phase 4: Design & Details (Month 8-12)
  → Invitations, wedding website, registry, hotel blocks
  → AI: content generation, style consistency checking

Phase 5: Execution (Month 12-16)
  → Mail invites, track RSVPs, create seating chart, finalize menu
  → AI: seating solver, RSVP predictions, budget tracking

Phase 6: Final Countdown (Last month)
  → Vendor confirmations, day-of timeline, rehearsal
  → AI: timeline optimization, weather contingency planning
```

**Where couples get stuck (= our biggest product opportunities):**
- Budget shock (60% exceed budget) → AI budget optimizer
- Decision fatigue (200+ photographers to choose from) → AI matching
- Seating charts (universally dreaded) → AI seating solver
- Vendor vetting (opaque pricing) → transparent profiles with real reviews
- Timeline anxiety ("Am I behind?") → AI-generated checklists
- Partner imbalance → collaborative tools with shared access

---

## Feature Specification

### Phase 1: Core Directory & Planning (MVP)

#### 1.1 Vendor Directory

**Categories (25+ categories, 4 tiers):**

| Tier | Categories | When Booked |
|------|-----------|-------------|
| Essential | Venues, Planners, Photographers, Videographers, Caterers | 12-18 months |
| Core | Florists, DJs/Bands, Officiants, Hair, Makeup, Bakers, Stationers | 9-12 months |
| Enhancement | Rentals, Lighting, Transport, Photo Booths, Bartenders, Decor | 6-9 months |
| Specialty | Jewelers, Dress Shops, Honeymoon, Hotels, Dance Instructors, Pet Handlers | Varies |

**Vendor Profile Page:**
- Hero: name, logo, tagline, category, style tags, location, starting price, response time badge
- Portfolio gallery (masonry, organized by real wedding, video support)
- About section (story, team bios, approach, wedding count)
- Packages & pricing (2-4 tiers with feature comparison, custom quote option)
- Availability calendar (check date widget)
- Reviews (overall + subcategory ratings, photo reviews, vendor responses, verified badges)
- FAQ section
- "Similar vendors" carousel
- Social proof badges (featured, awards, inquiry count)

**Search & Filtering:**
- Primary: location (city/zip + radius), category, wedding date, budget range
- Secondary: style tags, minimum rating, review count, response time, languages, diversity tags
- Results: card grid + map view toggle, sort by recommended/rating/price/distance/reviews
- Save/favorite, compare mode (side-by-side), quick availability check

#### 1.2 Booking & Inquiry Flow

**State machine:**
```
INQUIRY → QUOTE_SENT → QUOTE_ACCEPTED → DEPOSIT_PENDING → BOOKED → IN_PROGRESS → COMPLETED
  ↓           ↓              ↓                ↓               ↓
CANCELLED  DECLINED      CANCELLED         CANCELLED       CANCELLED
              ↓
           EXPIRED (auto, via BullMQ cleanup job)
```

- Structured inquiry form (date, venue, guest count, budget, style, questions)
- Vendor receives notification, responds with custom quote
- In-app messaging with read receipts, file sharing, quick-reply templates
- Auto follow-up nudges (48h no response)
- Quote with itemized pricing, terms, expiration
- Booking confirmation blocks vendor calendar
- "My Vendors" dashboard for couple

#### 1.3 Review System (Honest Reviews — Our Differentiator)

- Only verified couples (booked through platform or wedding date confirmed) can review
- Reviews auto-requested 2-4 weeks after wedding date
- Overall + subcategory ratings (Quality, Value, Responsiveness, Professionalism, Flexibility)
- Photo reviews (up to 10 wedding photos)
- Vendor response to each review
- **Reviews cannot be removed by vendors** — disputes go through platform moderation
- Recency weighting in overall score
- "Helpful" voting by other couples
- Distribution histogram (5-star bar chart)

#### 1.4 Wedding Checklist / Timeline

- Auto-generated month-by-month task list based on wedding date
- Tasks: title, description, due date (auto-calculated), assigned person, status, linked vendor category
- Custom tasks, drag-to-reorder, progress bar
- Templates for different wedding types (destination, micro, religious, courthouse)
- Overdue alerts via notification system

#### 1.5 Budget Tracker

- Total budget input with AI-suggested allocation by category
- Per-category: estimated, actual, deposits paid, balance due, payment dates
- Line items within categories
- "Who's paying" assignment (couple, bride's family, groom's family)
- Visual charts (pie by category, estimated vs actual bars, spending trend)
- Alerts: category over budget, payment due, threshold warnings (80%, 90%, 100%)
- Default categories: Venue, Catering, Photography, Videography, Flowers, Music, Attire, Beauty, Stationery, Cake, Transport, Favors, Officiant, Planner, Rings, License, Honeymoon, Misc

#### 1.6 Guest List & RSVP

- Guest records: name, email, phone, address, relationship, side (bride/groom/mutual), group/household
- Plus-one management (allowed, named/unnamed)
- Tier system (A-list must-invite, B-list if space)
- Per-event RSVP (ceremony, reception, rehearsal, etc.)
- Meal preferences, dietary restrictions, accessibility needs
- Custom RSVP questions
- RSVP deadline with auto-reminders (BullMQ notification queue)
- Online RSVP form (linked from wedding website, signed token so guests don't need accounts)
- Dashboard: total invited/attending/declined/pending, meal count summary
- Address export for invitation mailing

#### 1.7 Messaging

- Unified inbox for all vendor conversations
- Rich messages: text, images, files (contracts, mood boards), links
- Read receipts, typing indicators
- Vendor quick-reply templates
- Auto follow-up nudges
- **Tech:** NestJS WebSocket gateway with Socket.IO + Redis adapter for horizontal scaling

---

### Phase 2: Advanced Planning Tools

#### 2.1 Wedding Website Builder

**Pages (modular, toggleable):**
- Home (names, date, venue, countdown)
- Our Story (timeline, milestone photos)
- Wedding Party (photos, roles, bios)
- Events/Schedule (ceremony, reception, etc. with time, location, dress code, map)
- Travel & Accommodations (hotel blocks, airport, transportation)
- RSVP Form (integrated with guest list)
- Registry (links to external registries)
- Photo Gallery
- FAQ
- Live Guest Photo Upload (QR code for day-of sharing)

**Customization:** 10-20 themes, color palette picker, font pairing, custom domain/subdomain, password protection

#### 2.2 Seating Chart Builder

- Visual drag-and-drop floor plan editor
- Table shapes: round (8/10/12 seat), rectangular, head table
- Drag guests from list to tables
- Color coding by group
- Conflict/affinity flags
- Print-ready export for place cards
- Stats: unassigned count, capacity utilization

#### 2.3 Day-of Timeline Builder

- Anchor event: ceremony time
- Auto-suggested timeline with standard durations
- Blocks: getting ready, first look, photos, ceremony, cocktail hour, reception, dances, cake, exit
- Duration + buffer time per block
- Assign vendors/people to each block
- Shareable link/PDF for vendors and wedding party

#### 2.4 Mood Boards / Inspiration

- Pinterest-style board creation
- Upload or save from curated galleries
- Organize by category (florals, decor, attire, venue, colors)
- Share with vendors for style communication
- "Get This Look" — link inspiration images to relevant vendors

---

### Phase 3: AI Features (The Differentiator)

#### 3.1 AI Vendor Matching

- Style quiz: couple selects preferences (aesthetic, formality, vibe)
- AI embeds quiz answers + wedding details via OpenAI
- Cosine similarity against vendor profile embeddings (pgvector)
- Composite ranking: style match (40%) + rating (30%) + responsiveness (15%) + verified (15%)
- Filtered by availability + budget + location
- "Recommended for You" personalized homepage section

```typescript
// Vercel AI SDK tool
recommendVendorsTool = tool({
  description: 'Find and rank vendors based on couple preferences',
  parameters: z.object({
    category: z.string(),
    location: z.string(),
    budget: z.number().optional(),
    styles: z.array(z.string()).optional(),
    weddingDate: z.string().optional(),
    guestCount: z.number().optional(),
  }),
  execute: async (params) => {
    // 1. Embed query → 2. pgvector search → 3. Filter availability
    // 4. Composite score → 5. Return top 10 with explanations
  },
});
```

#### 3.2 AI Budget Optimizer

- Input: total budget, guest count, location, priorities
- Output: optimized allocation based on industry benchmarks + local market data
- "What if" scenarios: "Cut 20 guests?" "Move to off-peak date?" "Skip videography?"
- Overspend predictions based on booking trajectory
- Local price intelligence: "You're paying 20% above average for photography in your area"

#### 3.3 AI Seating Solver

- Input: guests, tables, relationships (must-sit-together, keep-apart, prefer-together)
- Algorithm: simulated annealing (constraint satisfaction)
  - Energy function: hard constraints (1000 points) + soft constraints (1 point)
  - 50,000 iterations, completes in < 5 seconds for 200 guests
- Multiple arrangement options to choose from
- One-click regeneration with adjusted constraints
- Runs as BullMQ job in `ai` queue for large weddings

#### 3.4 AI Planning Assistant (Chat)

- Conversational chatbot available throughout the planning journey
- Vercel AI SDK agent with multiple tools:
  - `searchVendors` — find vendors matching criteria
  - `recommendVendors` — personalized recommendations
  - `estimateBudget` — budget allocation advice
  - `optimizeBudget` — optimization suggestions
  - `checkAvailability` — vendor date checking
  - `solveSeating` — seating arrangement
  - `generateChecklist` — timeline based on wedding date
  - `suggestStyles` — style recommendations from mood board
- System prompt includes couple's wedding context (date, budget, style, guest count, location)
- SSE streaming to frontend
- Examples:
  - "Find me a boho photographer under $3000 in Austin available October 2026"
  - "How much should I budget for flowers with 150 guests?"
  - "Write me a day-of timeline for a 4pm ceremony"
  - "How much should I tip my photographer?"

#### 3.5 AI Content Generation

- **Vow writing assistant:** questionnaire → drafts in multiple tones (romantic, humorous, traditional)
- **Speech helper:** best man, maid of honor, parent speeches with anecdote prompts
- **Invitation wording:** formal, semi-formal, casual with proper etiquette
- **Wedding website copy:** "Our Story" section, FAQ, event descriptions
- **Thank-you notes:** personalized templates referencing specific gifts

#### 3.6 Predictive Analytics

- Popular date warnings: "Your date is the 3rd most popular — book venues early"
- Guest RSVP prediction: "Expect ~82% attendance based on demographics"
- Budget overrun prediction from spending patterns
- Weather risk for outdoor weddings
- Vendor availability forecasting

---

## Data Model (New Prisma Models)

### Entity Overview

```
VendorCategory          — Photography, Venue, Caterer, etc. (self-referencing for subcategories)
VendorProfile           — 1:1 with Tenant, contains listing info, geo coords, styles
VendorTag               — pet-friendly, lgbtq-friendly, destination, etc.
VendorProfileTag        — M2M join
PortfolioItem           — Images/videos per vendor (tenant-scoped)
PricingPackage          — Vendor pricing tiers (tenant-scoped)
VendorFaq               — Vendor FAQ items (tenant-scoped)
VendorAvailability      — Per-date availability status (tenant-scoped)

Wedding                 — Couple's wedding (client-scoped)
WeddingCollaborator     — Partner, planner, family access
WeddingEvent            — Ceremony, reception, rehearsal, brunch

Guest                   — Guest records per wedding
GuestGroup              — Household grouping
Rsvp                    — Per-guest-per-event RSVP
RsvpQuestion            — Custom RSVP questions

BudgetCategory          — Budget category per wedding
BudgetItem              — Line items within categories
Payment                 — Payment tracking (not processing)

ChecklistTemplate       — Platform-provided default checklists
ChecklistItem           — Per-wedding task items

Conversation            — Couple ↔ vendor threads
ConversationParticipant — Polymorphic participants
Message                 — Chat messages

Review                  — Verified reviews with subcategory ratings
Booking                 — Inquiry → quote → booked → completed lifecycle
BookingStatusHistory    — Audit trail of status transitions

WeddingWebsite          — 1:1 with Wedding
WebsiteTheme            — Theme templates
WebsitePage             — Modular pages
RegistryLink            — External registry links

SeatingChart            — Per-event seating layout
SeatingTable            — Table definitions
SeatAssignment          — Guest-to-table assignments
GuestRelationship       — Must-sit-together, keep-apart (for AI solver)

MoodBoard               — Inspiration boards per wedding
MoodBoardItem           — Pins (images, notes, vendor links)
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Vendors = Tenants | Leverages existing multi-tenancy, RLS, subscriptions without core changes |
| Couples = ClientUsers | Platform-global, interact across vendors through bookings/reviews/messages |
| Bookings are platform-scoped | Bridge two parties — both vendor and couple need access |
| Quote data lives on Booking (JSON) | Avoids separate table; quotes are tightly coupled to bookings |
| Two-phase search (Meilisearch + PostgreSQL) | Meilisearch for full-text/geo/facets; PostgreSQL for availability joins |
| Payment tracking, not processing | Reduces PCI scope; Stripe Connect added when marketplace payments needed |
| WebSocket for chat + collaboration | Low latency, Redis adapter for horizontal scaling |
| Simulated annealing for seating | Near-optimal for 50-300 guests, runs in seconds, no external dependency |

---

## Search Architecture

### Meilisearch `vendors` Index

```typescript
// Document shape
{
  id: "uuid",
  tenantId: "uuid",
  name: "Sarah's Photography",
  headline: "Award-winning Austin wedding photographer",
  description: "...",
  categorySlug: "photography",
  categoryName: "Photography",
  styles: ["bohemian", "rustic", "editorial"],
  tags: ["pet-friendly", "lgbtq-friendly"],
  city: "Austin",
  state: "TX",
  _geo: { lat: 30.2672, lng: -97.7431 },
  startingPrice: 3500,
  priceRange: "PREMIUM",
  averageRating: 4.8,
  reviewCount: 127,
  isVerified: true,
  responseTime: 45,
}

// Configuration
filterableAttributes: ["categorySlug", "styles", "tags", "city", "state",
  "priceRange", "startingPrice", "averageRating", "isVerified", "_geo"]
sortableAttributes: ["averageRating", "reviewCount", "startingPrice", "_geo"]
```

### Geo Search

```typescript
// Find photographers within 25 miles of Austin
meilisearch.index('vendors').search('photographer', {
  filter: ['_geoRadius(30.2672, -97.7431, 40233)', 'categorySlug = photography'],
  sort: ['_geoPoint(30.2672, -97.7431):asc'],
  facets: ['styles', 'priceRange', 'tags'],
});
```

### Semantic Search (pgvector)

Vendor profiles embedded as concatenated text (headline + description + styles + tags + top reviews). Couple queries like "rustic outdoor venue with mountain views under $10K" embedded at query time, matched via cosine similarity.

### Hybrid Strategy

1. Meilisearch full-text + geo + facets (fast)
2. pgvector semantic search (understanding)
3. Reciprocal rank fusion to merge results
4. Post-filter for availability via PostgreSQL

---

## Third-Party Integrations

| Integration | Purpose | Priority |
|------------|---------|----------|
| **Geocoding** (Google Maps / Mapbox) | Vendor address → lat/lng for geo search | MVP |
| **Maps** (react-map-gl / Google Maps) | Map view in search results, venue detail pages | MVP |
| **Stripe** (subscriptions) | Vendor subscription billing | MVP |
| **Stripe Connect** (marketplace) | Booking deposits, platform commission | Phase 2 |
| **Google Calendar / iCal** | Vendor availability sync, couple planning calendar | Phase 2 |
| **Instagram Graph API** | Portfolio import from vendor Instagram | Phase 2 |
| **Email (existing)** | RSVP invites, reminders, notifications | MVP |
| **Registry affiliate APIs** | Amazon, Zola, Target product display | Phase 3 |

---

## Business Model

### Revenue Streams

| Stream | Model | Phase |
|--------|-------|-------|
| **Vendor subscriptions** | Free / Pro ($49/mo) / Premium ($149/mo) | MVP |
| **Booking commissions** | 3-5% on bookings made through platform | Phase 2 |
| **Featured listings** | Pay for premium placement in search results | Phase 2 |
| **Wedding website premium** | Custom domains, premium themes ($5-10/mo) | Phase 2 |
| **Registry commissions** | Affiliate fees on registry purchases | Phase 3 |
| **Data insights** | Market reports for vendors (pricing trends, demand) | Phase 3 |

### Vendor Subscription Tiers

| Feature | Free | Pro ($49/mo) | Premium ($149/mo) |
|---------|------|-------------|-------------------|
| Basic profile listing | Yes | Yes | Yes |
| Portfolio photos | 10 | 50 | Unlimited |
| Pricing packages | 1 | 5 | Unlimited |
| Inquiry responses | 5/mo | Unlimited | Unlimited |
| Analytics dashboard | Basic | Advanced | Advanced |
| Featured badge | No | No | Yes |
| Priority search ranking | No | Boost | Top placement |
| AI-powered lead scoring | No | No | Yes |
| Team members | 1 | 5 | 25 |
| Quick-reply templates | 3 | 15 | Unlimited |

### Fair Pricing Differentiator

- **No 12-month lock-in** — monthly subscriptions, cancel anytime
- **Free tier is actually usable** — profile visible in search, not hidden
- **Pay-per-qualified-lead option** — alternative to subscription
- **ROI dashboard** — transparent metrics on profile views, inquiries, bookings

---

## Implementation Phases

### Phase 1 — MVP (8-10 weeks)

Core directory + basic planning tools. Enough for couples to find vendors and start planning.

**New Modules:**
1. `vendor-categories` — Category CRUD + seeding
2. `vendor-profiles` — Profile CRUD, portfolio, packages, FAQs
3. `vendor-search` — Meilisearch integration with geo + facets
4. `weddings` — Wedding CRUD, collaborator management
5. `bookings` — Inquiry → quote → booking state machine
6. `reviews` — Verified review system
7. `guests` — Guest list + RSVP management
8. `budget` — Budget categories, items, payment tracking
9. `checklist` — Checklist templates + per-wedding tasks
10. `messaging` — WebSocket chat between couples and vendors

**Frontend:**
- Web app: vendor search, profiles, inquiry, wedding dashboard
- Provider portal: profile management, booking inbox, availability calendar
- Admin: vendor moderation, category management, platform analytics

### Phase 2 — Advanced Tools (6-8 weeks)

Planning tools that make the platform sticky.

1. `wedding-websites` — Website builder with themes, pages, RSVP form
2. `seating` — Visual seating chart builder
3. `timeline` — Day-of timeline builder
4. `mood-boards` — Inspiration board creator
5. Stripe Connect integration for booking deposits
6. Google Calendar / iCal sync
7. Instagram portfolio import

### Phase 3 — AI Features (6-8 weeks)

The differentiator that no competitor has.

1. AI vendor matching (pgvector embeddings + style quiz)
2. AI budget optimizer
3. AI seating solver (simulated annealing)
4. AI planning assistant (Vercel AI SDK chat with tools)
5. AI content generation (vows, speeches, website copy)
6. Predictive analytics (RSVP predictions, budget overrun, date popularity)

### Phase 4 — Growth (Ongoing)

1. Mobile app (React Native)
2. Multicultural wedding support (tradition-specific checklists)
3. Registry integration
4. Post-wedding features (photo sharing, anniversary planning)
5. Vendor CRM tools (contracts, invoicing)
6. Marketplace payments at scale

---

## Key Metrics to Track

| Metric | Target |
|--------|--------|
| Couple sign-ups | 1000/mo by month 6 |
| Vendor sign-ups | 200/mo by month 6 |
| Inquiry-to-booking rate | >15% (industry avg ~8%) |
| Vendor response time | <4 hours median |
| Review submission rate | >40% of completed bookings |
| AI recommendation click-through | >25% |
| Monthly active couples | >60% of registered |
| Vendor churn rate | <5%/mo |
| NPS (couples) | >50 |
| NPS (vendors) | >30 |

---

## Our Competitive Advantages

1. **AI-native** — not bolted on, built into every feature from search to seating
2. **Honest reviews** — no censorship, verified-only, vendor responses
3. **Fair vendor pricing** — no lock-in, free tier that works, pay-per-result option
4. **Modern tech stack** — NestJS + React + PostgreSQL, not legacy PHP/jQuery
5. **Real-time collaboration** — WebSocket-powered shared planning
6. **Semantic search** — "find me a boho venue with mountain views" actually works
7. **End-to-end journey** — one platform from engagement to wedding day
8. **Mobile-first** — responsive, fast, offline-capable
9. **Data ownership** — couples can export everything, always
10. **Built for scale** — multi-tenant architecture, Docker/Coolify deployment ready
