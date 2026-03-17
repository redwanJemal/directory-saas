# Task 60: Admin — Business Moderation

## Summary
Add business moderation tools to the admin panel: verification request queue, business approval workflow, content moderation for reviews, and reported content handling.

## Required Changes

### 60.1 Verification Queue Page (`/verifications`)
- Table: business name, submitted date, status, documents
- Filters: status (pending/approved/rejected), date range
- Click to view full verification request with uploaded documents
- Approve/Reject buttons with notes field
- On approve: business gets verified badge

### 60.2 Business Management Enhancements (`/tenants`)
- Add columns: country, city, categories, verified status, contact clicks (7d)
- Add filters: country, city, category, verified/unverified
- Quick actions: verify, suspend, feature/unfeature
- Business detail view: full profile preview as users see it

### 60.3 Review Moderation
- Add `/reviews` page to admin sidebar
- Table: reviewer, business, rating, comment, date, flagged status
- Ability to hide/remove inappropriate reviews
- Flag system: users can report reviews, admin sees flagged queue

### 60.4 Dashboard Updates
- Admin dashboard stats: total businesses, pending verifications, new this week, total reviews
- Chart: new businesses over time (by country)
- Chart: contact clicks by type (whatsapp, phone, email)

### 60.5 Sidebar Navigation
- Add to admin sidebar: Verifications (with pending count badge), Reviews

## Acceptance Criteria
- [ ] Verification queue with approve/reject flow
- [ ] Business list with country/city/category columns and filters
- [ ] Review moderation page with flagged queue
- [ ] Dashboard shows Habesha Hub specific metrics
- [ ] All admin pages work with existing auth
