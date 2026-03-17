# Task 65: Telegram Mini App

## Summary
Build a Telegram Mini App for business discovery, leveraging the existing API. Ethiopian diaspora in the Gulf uses Telegram heavily — this is a key acquisition channel.

## Required Changes
- Create Telegram bot with bot token
- Mini App: React app embedded in Telegram WebApp
- Features: search businesses, browse categories, view profiles, share to chat
- Deep links: `t.me/habeshahub_bot?startapp=business_{slug}`
- Bot commands: /search, /categories, /deals, /near (with location sharing)
- Notification channel: post new businesses and deals to a public channel
- Auth: Telegram initData verification (reuse pattern from Gebeya/Temari projects)

## Acceptance Criteria
- [ ] Telegram Mini App opens and loads businesses
- [ ] Search and category browsing works
- [ ] Business profiles viewable in Mini App
- [ ] Deep links work for sharing businesses
- [ ] Bot posts to channel on new businesses/deals
