# Task 58: Web App — Business Profile Page

## Summary
Build the full public business profile page showing all business details, services/packages, gallery, reviews, business hours, location, and WhatsApp contact button.

## Required Changes

### 58.1 Business Profile Page (`/business/:slug`)
- **Header**: Cover photo (or gradient fallback), business name, verified badge, category badges, city/country
- **Contact Bar**: WhatsApp button (green, prominent), Phone, Email, Website, Instagram links
- **About Section**: Business description, established date
- **Services/Packages**: Cards showing service name, description, price, features
- **Gallery**: Photo grid from portfolio items (lightbox on click)
- **Business Hours**: Weekly schedule table (highlight "Open Now" if applicable)
- **Reviews Section**: Average rating, rating distribution bar chart, individual review cards
- **FAQs**: Accordion with business FAQs
- **Active Deals**: Deal cards with discount badge if any active deals
- **Location**: City, country display (map placeholder for future)

### 58.2 WhatsApp CTA
- Floating WhatsApp button (bottom-right, always visible)
- Click records contact-click and opens WhatsApp URL
- Default message includes business name

### 58.3 Review Submission
- "Write a Review" button (requires login)
- Star rating (1-5) + optional title + comment
- Success toast after submission

### 58.4 Share & Social
- Share button with options: Copy link, WhatsApp share, Telegram share
- Proper OG tags per business for social sharing previews

### 58.5 Related Businesses
- "Similar Businesses" section at bottom
- Show 4 businesses from same category + city
- Exclude current business

## Acceptance Criteria
- [ ] Full business profile page with all sections
- [ ] WhatsApp button records click and opens chat
- [ ] Reviews displayed with rating distribution
- [ ] Business hours show "Open Now" indicator
- [ ] Share functionality works
- [ ] Page is responsive and loads fast
