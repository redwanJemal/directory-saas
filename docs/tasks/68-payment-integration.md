# Task 68: Payment Integration

## Summary
Integrate Stripe for subscription payments. Businesses pay for premium listings, featured placement, and enhanced profiles.

## Required Changes
- Stripe integration in backend (stripe npm package)
- Subscription checkout flow: select plan → Stripe checkout → webhook confirms
- Webhook handler for subscription events (created, updated, cancelled, payment_failed)
- Subscription management page in provider portal
- Update plan limits enforcement with active subscription check
- Admin: view subscription revenue, active subscriptions by plan

## Acceptance Criteria
- [ ] Stripe checkout flow works end-to-end
- [ ] Webhook processes subscription events
- [ ] Provider portal shows subscription status
- [ ] Plan limits enforced based on active subscription
