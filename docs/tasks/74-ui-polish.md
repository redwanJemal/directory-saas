# Task 74: UI Polish & Animation Enhancements

## Summary
Final UI polish pass across all public web app pages. Add remaining animations, improve loading states, enhance mobile experience, and ensure consistent visual quality.

## Required Changes

### 74.1 Search Results Page
- Add StaggerGrid animation to search results (stagger each vendor card)
- Animate filter sidebar show/hide on mobile (slide from left)
- Add skeleton loading with stagger animation while fetching
- Smooth transition when changing sort/filters (fade out old, fade in new)

### 74.2 Business Profile Page
- Parallax effect on cover image hero (using ParallaxSection from motion.tsx)
- Animate contact buttons entrance (stagger from left)
- Animate rating distribution bars (fill from 0 to actual width on scroll into view)
- Scroll-reveal for each section (About, Packages, Gallery, Hours, Reviews, FAQs, Deals)
- Floating WhatsApp button entrance animation (slide up from bottom with bounce)
- Gallery image hover: subtle zoom + overlay with "View" icon

### 74.3 Category & City Pages
- StaggerGrid for business cards on category/city pages
- Animate subcategory chips entrance
- City page stats (total businesses, reviews) count-up animation

### 74.4 Deals Page
- StaggerGrid for deal cards
- Expiry countdown timer animation (pulse when < 24h remaining)
- Discount badge bounce animation on hover

### 74.5 Events & Jobs Pages
- StaggerGrid for event/job cards
- RSVP button animation feedback (scale + checkmark)
- Apply button loading state animation

### 74.6 Auth Pages (Login, Register)
- Fade-in entrance for login/register cards
- Form field focus animations (label float or border glow)
- Submit button loading spinner

### 74.7 Global Improvements
- Page transition: fade between routes (wrap Router Outlet with AnimatePresence)
- Scroll-to-top on page navigation
- Improved loading states: replace plain spinners with branded skeleton screens
- Error states: friendly error illustrations with retry button animation
- Empty states: animated illustrations (use simple SVG or emoji)
- Toast notifications: slide-in animation (already handled by Sonner)

### 74.8 Mobile-Specific
- Bottom navigation bar for mobile (Search, Categories, Deals, Profile)
- Swipeable image galleries
- Pull-to-refresh gesture (if applicable)
- Hamburger menu animation (X transition)

## Acceptance Criteria
- [ ] Search results animate on load and filter change
- [ ] Business profile has parallax hero and section reveals
- [ ] Category/city/deals pages have stagger animations
- [ ] Auth pages have entrance animations
- [ ] Page transitions work smoothly
- [ ] Mobile experience is polished
- [ ] All apps build and tests pass
