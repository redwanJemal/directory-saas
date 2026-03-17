# Task 63: Community Events Module

## Summary
Allow businesses and community organizations to post events. Community events calendar with RSVP. Events appear on business profiles and a dedicated events page.

## Required Changes
- Create Event model: title, description, date, time, location, imageUrl, providerProfileId, maxAttendees, eventType (business/community)
- Create EventRsvp model: eventId, userId, status (going/interested/not-going)
- Provider endpoints: CRUD for events
- Public endpoints: list/filter events by date/city/category
- Events page on web app with calendar view and list view
- Event cards on business profile page
- RSVP button for logged-in users
- Upcoming events section on homepage

## Acceptance Criteria
- [ ] Businesses can create/manage events
- [ ] Public events page with filters
- [ ] RSVP system for logged-in users
- [ ] Events appear on business profiles
