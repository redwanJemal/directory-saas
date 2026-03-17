# Task 54: WhatsApp & Contact Integration

## Summary
Add WhatsApp click-to-chat support, standardize contact fields, and implement contact analytics (track how many times a business's WhatsApp/phone was clicked).

## Required Changes

### 54.1 Schema

**Create ContactClick model** for analytics:
```prisma
model ContactClick {
  id                String   @id @default(uuid()) @db.Uuid
  providerProfileId String   @map("provider_profile_id") @db.Uuid
  type              String   // whatsapp, phone, email, website, instagram
  clientUserId      String?  @map("client_user_id") @db.Uuid
  ipAddress         String?  @map("ip_address")
  userAgent         String?  @map("user_agent")
  createdAt         DateTime @default(now()) @map("created_at") @db.Timestamptz

  providerProfile ProviderProfile @relation(fields: [providerProfileId], references: [id], onDelete: Cascade)

  @@index([providerProfileId, type, createdAt])
  @@map("contact_clicks")
}
```

### 54.2 Contact Click API
- `POST /api/v1/providers/:id/contact-click` — record a contact click (public, rate-limited)
  - Body: `{ type: "whatsapp" | "phone" | "email" | "website" | "instagram" }`
  - Returns: formatted contact URL (e.g., `https://wa.me/971501234567?text=...`)

### 54.3 WhatsApp URL Generation
- Format WhatsApp number to international format (strip spaces, add country code)
- Generate click-to-chat URL: `https://wa.me/{number}?text={defaultMessage}`
- Default message template: "Hi! I found your business on Habesha Hub. I'd like to inquire about your services."
- Message template configurable per business in provider settings

### 54.4 Provider Profile Updates
- Add `whatsappMessage` field to provider settings (custom greeting)
- Return formatted `whatsappUrl` in provider detail response
- Return contact click counts in provider dashboard stats

### 54.5 Admin Analytics
- `GET /api/v1/admin/analytics/contacts` — aggregate contact clicks by type, by day
- Provider dashboard: show contact click stats (last 7/30 days)

### 54.6 Tests
- Unit tests for WhatsApp URL formatting
- Unit tests for contact click recording and rate limiting
- Unit tests for analytics aggregation

## Acceptance Criteria
- [ ] WhatsApp URL generated correctly with international format
- [ ] Contact clicks recorded with type and timestamp
- [ ] Provider dashboard shows contact analytics
- [ ] Rate limiting prevents click spam
- [ ] `npm run build` passes, `npm test` passes
