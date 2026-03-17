# Task 53: Business Verification System

## Summary
Implement a verification flow where businesses can request verification, upload trade license/documents, and admins can approve/reject. Verified businesses get a badge and trust score boost in search rankings.

## Required Changes

### 53.1 Schema

**Create VerificationRequest model**:
```prisma
model VerificationRequest {
  id                String    @id @default(uuid()) @db.Uuid
  providerProfileId String    @map("provider_profile_id") @db.Uuid
  status            String    @default("pending") // pending, approved, rejected
  tradeLicenseUrl   String?   @map("trade_license_url")
  documentUrls      Json      @default("[]") @map("document_urls")
  notes             String?   // Business notes
  adminNotes        String?   @map("admin_notes") // Admin feedback
  reviewedBy        String?   @map("reviewed_by") @db.Uuid
  reviewedAt        DateTime? @map("reviewed_at") @db.Timestamptz
  createdAt         DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt         DateTime  @updatedAt @map("updated_at") @db.Timestamptz

  providerProfile ProviderProfile @relation(fields: [providerProfileId], references: [id], onDelete: Cascade)

  @@index([providerProfileId])
  @@index([status])
  @@map("verification_requests")
}
```

### 53.2 Provider API
- `POST /api/v1/providers/me/verification` — submit verification request with documents
- `GET /api/v1/providers/me/verification` — check current verification status

### 53.3 Admin API
- `GET /api/v1/admin/verifications` — list pending/all requests (paginated)
- `PATCH /api/v1/admin/verifications/:id` — approve or reject with notes
- On approve: set `isVerified=true`, `verifiedAt=now()` on ProviderProfile

### 53.4 Search Ranking
- Verified businesses rank higher in search results
- Add `isVerified` filter to search: `?verified=true`
- Return verification badge in search results

### 53.5 Tests
- Unit tests for verification request flow
- Unit tests for admin approval/rejection
- Unit tests for search ranking boost

## Acceptance Criteria
- [ ] Business can submit verification request with documents
- [ ] Admin can list, approve, reject verification requests
- [ ] Approved businesses get isVerified=true and verifiedAt set
- [ ] Search supports verified filter and ranks verified higher
- [ ] `npm run build` passes, `npm test` passes
