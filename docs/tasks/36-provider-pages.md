# Task 36: Provider Portal — Bookings, Reviews, Team, Messages, Calendar, Analytics, Settings Pages

## Summary
Build all remaining provider portal pages: Bookings management with status workflow, Reviews with responses, Team member management, Messages (conversation threads), Calendar view, Analytics dashboard, and Settings. These complete the provider portal's feature set.

## Current State
- Provider portal has layout (Task 34), profile and portfolio pages (Task 35)
- Remaining nav items show placeholder pages
- Backend endpoints available for tenant-scoped resources:
  - Bookings: `GET /api/v1/bookings`, `GET /api/v1/bookings/:id`, `PATCH /api/v1/bookings/:id/status`, `POST /api/v1/bookings/:id/quote`
  - Reviews: `GET /api/v1/reviews`, `POST /api/v1/reviews/:id/response`
  - Team: `GET /api/v1/tenants/me/users`, `POST /api/v1/tenants/me/users/invite`, `PATCH /api/v1/tenants/me/users/:id/role`, `DELETE /api/v1/tenants/me/users/:id`
  - Messages: `GET /api/v1/conversations`, `GET /api/v1/conversations/:id/messages`, `POST /api/v1/conversations/:id/messages`
  - Notifications: `GET /api/v1/notifications`
- Data table component exists in admin app but needs to be replicated for provider portal (or shared)

## Required Changes

### 36.1 Install Dependencies

```bash
cd apps/provider-portal && npm install @tanstack/react-table date-fns recharts
```

### 36.2 Replicate Data Table Component

Copy the data table component from admin to provider-portal:

```
apps/provider-portal/src/components/data-table/
├── data-table.tsx
├── data-table-pagination.tsx
├── data-table-toolbar.tsx
├── data-table-row-actions.tsx
├── data-table-column-header.tsx
└── index.ts
```

Also copy `apps/provider-portal/src/components/status-badge.tsx` from admin app.

These should be identical implementations. (Task 39 will later extract these into truly shared components.)

### 36.3 Bookings Page

Create `apps/provider-portal/src/features/bookings/`:
```
features/bookings/
├── bookings-page.tsx
├── types.ts
├── schemas.ts
├── hooks/
│   └── use-bookings.ts
└── components/
    ├── booking-detail-sheet.tsx
    ├── send-quote-dialog.tsx
    └── update-status-dialog.tsx
```

**BookingsPage**:
- Tabs across top: All, Inquiries, Active, Completed, Cancelled
- Each tab filters the data table by status
- Data table columns: Couple Name, Event Date (formatted), Status (colored badge), Package Name, Amount (formatted currency), Actions dropdown
- Actions per status:
  - inquiry: View, Send Quote
  - quoted: View
  - booked: View, Mark Active
  - active: View, Mark Complete
  - completed: View
  - cancelled: View
- Search by couple name

**Booking status flow** (state machine):
```
inquiry → quoted → booked → active → completed
                                   → cancelled
inquiry → cancelled
quoted → cancelled
```

**Status badge colors**:
- inquiry: blue
- quoted: yellow
- booked: indigo
- active: green
- completed: gray
- cancelled: red

**BookingDetailSheet** — slide-out with full details:
- Couple info (name, email, phone)
- Event details (date, venue, guest count)
- Package selected
- Quote amount + breakdown
- Status history timeline
- Messages/notes

**SendQuoteDialog**:
- Form: amount (number), description (textarea), valid until (date), notes
- Zod validation
- Submit calls `POST /api/v1/bookings/:id/quote`

**UpdateStatusDialog**:
- Confirmation dialog with next status shown
- Optional notes field
- Submit calls `PATCH /api/v1/bookings/:id/status`

### 36.4 Reviews Page

Create `apps/provider-portal/src/features/reviews/`:
```
features/reviews/
├── reviews-page.tsx
├── types.ts
├── hooks/
│   └── use-reviews.ts
└── components/
    ├── review-card.tsx
    ├── respond-dialog.tsx
    └── rating-summary.tsx
```

**ReviewsPage**:
- Rating summary card at top:
  - Average rating (large number + star display)
  - Total reviews count
  - Rating distribution bar chart (5 bars for 1-5 stars, showing count per rating)
- Filter by rating (all/5/4/3/2/1 stars)
- List of review cards (not data table — card layout is better for reviews)

**ReviewCard**:
- Star rating display (filled/empty stars using Lucide Star icon)
- Reviewer name + date
- Review text
- Photos (if any) — thumbnail gallery
- Provider response (if exists) — indented block below
- "Respond" button (if no response yet)

**RespondDialog**:
- Textarea for response
- Character count
- Submit calls `POST /api/v1/reviews/:id/response`

**RatingSummary**:
```typescript
function RatingSummary({ average, total, distribution }: RatingSummaryProps) {
  return (
    <Card>
      <CardContent className="flex gap-6 p-6">
        <div className="text-center">
          <div className="text-4xl font-bold">{average.toFixed(1)}</div>
          <StarRating rating={average} />
          <p className="text-sm text-muted-foreground">{t('reviews.totalReviews', { count: total })}</p>
        </div>
        <div className="flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map((stars) => (
            <div key={stars} className="flex items-center gap-2">
              <span className="text-sm w-3">{stars}</span>
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 rounded-full"
                  style={{ width: `${(distribution[stars] / total) * 100}%` }}
                />
              </div>
              <span className="text-sm text-muted-foreground w-8">{distribution[stars]}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

### 36.5 Team Page

Create `apps/provider-portal/src/features/team/`:
```
features/team/
├── team-page.tsx
├── types.ts
├── schemas.ts
├── hooks/
│   └── use-team.ts
└── components/
    ├── invite-member-dialog.tsx
    ├── change-role-dialog.tsx
    └── remove-member-dialog.tsx
```

**TeamPage**:
- Data table with columns: Name, Email, Role (badge), Joined (relative date), Actions
- "Invite Member" button
- Actions: Change Role, Remove Member

**InviteMemberDialog**:
- Form: email, role (select from tenant roles)
- Zod validation
- Submit calls `POST /api/v1/tenants/me/users/invite`

**ChangeRoleDialog**:
- Current role displayed
- Role select dropdown
- Submit calls `PATCH /api/v1/tenants/me/users/:id/role`

**RemoveMemberDialog**:
- AlertDialog confirmation with member name
- Submit calls `DELETE /api/v1/tenants/me/users/:id`

### 36.6 Messages Page

Create `apps/provider-portal/src/features/messages/`:
```
features/messages/
├── messages-page.tsx
├── types.ts
├── hooks/
│   └── use-messages.ts
└── components/
    ├── conversation-list.tsx
    ├── message-thread.tsx
    └── message-input.tsx
```

**MessagesPage** — Split panel layout:
- Left panel (1/3 width on desktop, full width on mobile): conversation list
- Right panel (2/3 width on desktop): message thread
- Mobile: show conversation list by default, click to enter thread, back button to return

**ConversationList**:
- List of conversations sorted by last message time
- Each item shows: avatar, name, last message preview (truncated), timestamp, unread badge count
- Active conversation highlighted
- Search conversations by name

**MessageThread**:
- Header: recipient name + avatar
- Scrollable message list (newest at bottom)
- Each message: bubble (left for received, right for sent), text, timestamp
- Auto-scroll to bottom on new messages
- File attachments shown as clickable links/thumbnails

**MessageInput**:
- Textarea (auto-resize) + Send button
- Attach file button (opens file picker)
- Send on Enter (Shift+Enter for newline)
- Disabled while sending

**Polling for new messages**:
```typescript
const { data: messages } = useQuery({
  queryKey: ['messages', conversationId],
  queryFn: () => fetchMessages(conversationId),
  refetchInterval: 5000, // Poll every 5 seconds
});
```

### 36.7 Calendar Page

Create `apps/provider-portal/src/features/calendar/`:
```
features/calendar/
├── calendar-page.tsx
└── hooks/
    └── use-calendar.ts
```

**CalendarPage**:
- Full month calendar grid (reuse pattern from availability tab in Task 35, but larger)
- Events/bookings displayed on calendar dates:
  - Each day cell shows colored dots or small event cards
  - Booking: name + status color
  - Blocked: gray overlay
- Click date to see day detail (dialog or side panel):
  - List of bookings on that date
  - Quick block/unblock toggle
- Navigation: prev/next month, today button
- Legend: Available (green), Booked (blue), Blocked (gray)

### 36.8 Analytics Page

Create `apps/provider-portal/src/features/analytics/`:
```
features/analytics/
├── analytics-page.tsx
└── hooks/
    └── use-analytics.ts
```

**AnalyticsPage** — Dashboard with charts using recharts:
- Time period selector (7 days, 30 days, 90 days, 12 months)
- Cards row: Profile Views, Inquiries, Booking Rate, Revenue (with trend arrows)
- Profile Views chart (Line chart — views over time)
- Inquiry Trend chart (Bar chart — inquiries per week/month)
- Booking Conversion funnel (views → inquiries → quotes → bookings)
- Revenue chart (Bar chart — monthly revenue)

**Chart components using recharts**:
```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

function ProfileViewsChart({ data }: { data: Array<{ date: string; views: number }> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('analytics.profileViews')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="date" className="text-muted-foreground" />
            <YAxis className="text-muted-foreground" />
            <Tooltip />
            <Line type="monotone" dataKey="views" className="stroke-primary" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

If API endpoints for analytics don't exist yet, use placeholder data with a comment indicating which endpoint should provide the data.

### 36.9 Settings Page

Create `apps/provider-portal/src/features/settings/`:
```
features/settings/
├── settings-page.tsx
└── components/
    ├── notification-settings.tsx
    ├── business-hours.tsx
    └── account-settings.tsx
```

**SettingsPage** — Tabbed layout:

**Notification Preferences tab**:
- Toggle switches for: email on new inquiry, email on new review, email on new message, email on booking status change
- Save button

**Business Hours tab**:
- Day-of-week rows (Mon-Sun)
- Each row: checkbox (open/closed), start time select, end time select
- Save button

**Account Settings tab**:
- Change password form: current password, new password, confirm new password
- Delete account (dangerous action with confirmation)

### 36.10 Update i18n Translations

Add all new translation keys to `apps/provider-portal/src/i18n/en.json` and `am.json` for: bookings, reviews, team, messages, calendar, analytics, settings namespaces.

## Acceptance Criteria
- [ ] Bookings page: tabs filter by status, data table loads bookings, view details in Sheet
- [ ] Booking workflow: inquiry → send quote → booked → active → completed (status transitions work)
- [ ] Send quote dialog: form validates with Zod, submits to API, shows toast
- [ ] Reviews page: rating summary card with distribution, review cards with star display
- [ ] Review response: dialog submits response, response shown below review
- [ ] Team page: list members, invite new member (email + role), change role, remove member
- [ ] Messages page: conversation list with unread badges, message thread with bubbles, send messages
- [ ] Messages: polling for new messages every 5 seconds
- [ ] Calendar page: month view with bookings shown, click date for details, block/unblock dates
- [ ] Analytics page: stat cards, line/bar charts with recharts, time period selector
- [ ] Settings page: notification toggles, business hours grid, account settings
- [ ] All pages use TanStack Query hooks for data fetching
- [ ] All forms validate with Zod schemas
- [ ] All strings from i18n translation files
- [ ] All pages responsive on mobile
- [ ] Provider portal builds with 0 errors

## Files to Create/Modify
- `apps/provider-portal/src/components/data-table/*.tsx` (create — copy from admin)
- `apps/provider-portal/src/components/status-badge.tsx` (create — copy from admin)
- `apps/provider-portal/src/features/bookings/bookings-page.tsx` (replace)
- `apps/provider-portal/src/features/bookings/types.ts` (create)
- `apps/provider-portal/src/features/bookings/schemas.ts` (create)
- `apps/provider-portal/src/features/bookings/hooks/use-bookings.ts` (create)
- `apps/provider-portal/src/features/bookings/components/booking-detail-sheet.tsx` (create)
- `apps/provider-portal/src/features/bookings/components/send-quote-dialog.tsx` (create)
- `apps/provider-portal/src/features/bookings/components/update-status-dialog.tsx` (create)
- `apps/provider-portal/src/features/reviews/reviews-page.tsx` (replace)
- `apps/provider-portal/src/features/reviews/types.ts` (create)
- `apps/provider-portal/src/features/reviews/hooks/use-reviews.ts` (create)
- `apps/provider-portal/src/features/reviews/components/review-card.tsx` (create)
- `apps/provider-portal/src/features/reviews/components/respond-dialog.tsx` (create)
- `apps/provider-portal/src/features/reviews/components/rating-summary.tsx` (create)
- `apps/provider-portal/src/features/team/team-page.tsx` (replace)
- `apps/provider-portal/src/features/team/types.ts` (create)
- `apps/provider-portal/src/features/team/schemas.ts` (create)
- `apps/provider-portal/src/features/team/hooks/use-team.ts` (create)
- `apps/provider-portal/src/features/team/components/invite-member-dialog.tsx` (create)
- `apps/provider-portal/src/features/team/components/change-role-dialog.tsx` (create)
- `apps/provider-portal/src/features/team/components/remove-member-dialog.tsx` (create)
- `apps/provider-portal/src/features/messages/messages-page.tsx` (replace)
- `apps/provider-portal/src/features/messages/types.ts` (create)
- `apps/provider-portal/src/features/messages/hooks/use-messages.ts` (create)
- `apps/provider-portal/src/features/messages/components/conversation-list.tsx` (create)
- `apps/provider-portal/src/features/messages/components/message-thread.tsx` (create)
- `apps/provider-portal/src/features/messages/components/message-input.tsx` (create)
- `apps/provider-portal/src/features/calendar/calendar-page.tsx` (replace)
- `apps/provider-portal/src/features/calendar/hooks/use-calendar.ts` (create)
- `apps/provider-portal/src/features/analytics/analytics-page.tsx` (replace)
- `apps/provider-portal/src/features/analytics/hooks/use-analytics.ts` (create)
- `apps/provider-portal/src/features/settings/settings-page.tsx` (replace)
- `apps/provider-portal/src/features/settings/components/notification-settings.tsx` (create)
- `apps/provider-portal/src/features/settings/components/business-hours.tsx` (create)
- `apps/provider-portal/src/features/settings/components/account-settings.tsx` (create)
- `apps/provider-portal/src/i18n/en.json` (modify)
- `apps/provider-portal/src/i18n/am.json` (modify)

## Dependencies
- Task 28 (Frontend Shared Foundation) — shadcn/ui components
- Task 29 (Frontend i18n) — translation strings
- Task 30 (Frontend Auth) — auth store, API client
- Task 34 (Provider Layout) — DashboardLayout, sidebar, tenant context
- Task 35 (Provider Profile) — calendar grid pattern, file upload pattern
