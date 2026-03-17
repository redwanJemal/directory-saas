# Task 61: Provider Portal — Habesha Hub Customization

## Summary
Customize the provider portal (business owner dashboard) for Habesha Hub: multi-category selector, country/city picker, business hours editor, deals manager, WhatsApp configuration, and contact analytics.

## Required Changes

### 61.1 Profile Setup
- **Multi-category selector**: searchable checklist of categories, max 5, mark one as primary
- **Country/City picker**: dropdown cascading (select country → cities populate)
- **WhatsApp number**: input with country code prefix, format validation
- **Instagram/TikTok**: social media handle inputs
- **Business hours editor**: day-by-day open/close time picker, "Closed" toggle per day

### 61.2 Deals Manager (new page)
- Add "Deals" to provider sidebar navigation
- List current deals with status (active/expired/scheduled)
- Create deal dialog: title, description, discount %, prices, image, start/end dates
- Edit/delete deals
- Deal preview showing how it appears to users

### 61.3 Contact Analytics (new section on dashboard)
- Chart: contact clicks over last 30 days (by type: WhatsApp, phone, email)
- Total clicks this week vs last week (with trend arrow)
- "Most popular contact method" insight

### 61.4 Dashboard Customization
- Welcome: "Welcome back, [Business Name]"
- Stats cards: Profile Views (placeholder), Contact Clicks, Reviews, Active Deals
- Quick actions: "Edit Profile", "Add Deal", "View Listing"

### 61.5 WhatsApp Setup
- Custom greeting message editor (what users see when they click WhatsApp)
- Preview of the WhatsApp chat link
- Default message template with business name auto-filled

## Acceptance Criteria
- [ ] Multi-category selector works with primary marking
- [ ] Country/city cascading picker
- [ ] Business hours editor with day-by-day controls
- [ ] Deals CRUD with preview
- [ ] Contact analytics on dashboard
- [ ] WhatsApp greeting message customization
