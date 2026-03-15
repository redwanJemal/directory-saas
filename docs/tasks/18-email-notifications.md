# Task 18: Email & Notification Service

## Summary
Implement email sending with templates, in-app notifications with read/unread tracking, and push notification stubs. All notifications go through the job queue for reliability.

## Current State
- SMTP configured (Task 03).
- Job queue available (Task 16).
- Event system available (Task 17).

## Required Changes

### 18.1 Email Service

**File**: `backend/src/common/services/email.service.ts`

```typescript
@Injectable()
export class EmailService {
  async send(to: string, template: string, data: Record<string, any>): Promise<void>;
  async sendBulk(recipients: Array<{ to: string; template: string; data: Record<string, any> }>): Promise<void>;
}
```

- Uses `nodemailer` for SMTP
- All sends go through BullMQ `email` queue
- Templates: simple HTML with variable substitution (handlebars or custom)

### 18.2 Email Templates

**File**: `backend/src/common/services/email-templates/`

- `welcome.html` — New user registration
- `password-reset.html` — Password reset link
- `tenant-invite.html` — Invitation to join tenant
- `plan-upgrade.html` — Plan upgrade confirmation

### 18.3 Notification Model

Add to Prisma schema:
```prisma
model Notification {
  id        String    @id @default(uuid()) @db.Uuid
  tenantId  String?   @map("tenant_id") @db.Uuid
  userId    String    @map("user_id") @db.Uuid
  userType  String    @map("user_type")
  type      String                       // 'info', 'warning', 'success', 'error'
  title     String
  message   String
  data      Json?                        // Action URL, entity reference, etc.
  readAt    DateTime? @map("read_at") @db.Timestamptz
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz
  @@index([userId, userType, readAt])
  @@index([tenantId])
  @@map("notifications")
}
```

### 18.4 Notification Service

**File**: `backend/src/modules/notifications/notifications.service.ts`

- `create(userId, userType, notification)` — Create in-app notification
- `findAll(userId, query)` — List with pagination, filter read/unread
- `markRead(userId, notificationId)` — Mark single as read
- `markAllRead(userId)` — Mark all as read
- `getUnreadCount(userId)` — Count unread

### 18.5 Notification Endpoints

- `GET /api/v1/notifications` — List my notifications
- `PATCH /api/v1/notifications/:id/read` — Mark as read
- `POST /api/v1/notifications/read-all` — Mark all as read
- `GET /api/v1/notifications/unread-count` — Get unread count

### 18.6 Tests

- Test: Email queued via BullMQ
- Test: Email template renders with variables
- Test: Notification created and queryable
- Test: Mark read updates `readAt`
- Test: Unread count correct
- Test: Notifications scoped to user

## Acceptance Criteria

1. Email sending via BullMQ queue (reliable delivery)
2. HTML templates with variable substitution
3. In-app notifications with read/unread tracking
4. Notification endpoints for listing, marking read
5. Mailpit for development (no real SMTP)
6. All tests pass
