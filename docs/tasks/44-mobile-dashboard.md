# Task 44: Mobile Wedding Dashboard — Overview, Stats, Quick Actions

## Summary
Build the wedding planning dashboard with wedding setup flow, countdown, quick stats, booking management, and vendor tracking. Includes multi-step wedding creation onboarding, dashboard with real-time stats, booking workflow (inquiry → quoted → booked → completed), and booked vendors view. All data from real API endpoints.

## Current State
- Tasks 41-43 provide scaffolding, auth, and vendor search
- Home tab shows welcome + categories + featured vendors
- Bookings tab has placeholder content
- Backend has wedding/event endpoints, booking endpoints with status workflow
- Backend booking statuses: INQUIRY → QUOTED → BOOKED → COMPLETED (also CANCELLED)

## Required Changes

### 44.1 Wedding API Hooks

**hooks/api/use-wedding.ts:**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Wedding {
  id: string;
  weddingDate: string;
  partnerName: string;
  estimatedGuests: number;
  venue: string | null;
  stylePreferences: string[];
  budget: number | null;
  createdAt: string;
}

interface WeddingStats {
  daysUntilWedding: number;
  vendorsBooked: number;
  guestsConfirmed: number;
  budgetSpentPercent: number;
  tasksDonePercent: number;
  totalTasks: number;
  completedTasks: number;
}

export function useWedding() {
  return useQuery({
    queryKey: ['wedding'],
    queryFn: async () => {
      const response = await api.get('/wedding');
      return response.data as Wedding;
    },
  });
}

export function useWeddingStats() {
  return useQuery({
    queryKey: ['wedding', 'stats'],
    queryFn: async () => {
      const response = await api.get('/wedding/stats');
      return response.data as WeddingStats;
    },
  });
}

export function useCreateWedding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      weddingDate: string;
      partnerName: string;
      estimatedGuests: number;
      venue?: string;
      stylePreferences?: string[];
    }) => {
      const response = await api.post('/wedding', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wedding'] });
    },
  });
}
```

**hooks/api/use-bookings.ts:**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Booking {
  id: string;
  vendorId: string;
  vendor: {
    id: string;
    businessName: string;
    category: string;
    coverImage: string | null;
  };
  status: 'INQUIRY' | 'QUOTED' | 'BOOKED' | 'COMPLETED' | 'CANCELLED';
  message: string;
  quotedPrice: number | null;
  weddingDate: string | null;
  guestCount: number | null;
  createdAt: string;
  updatedAt: string;
}

export function useBookings(status?: string) {
  return useQuery({
    queryKey: ['bookings', status],
    queryFn: async () => {
      const params = status ? `?filter[status]=${status}` : '';
      const response = await api.get(`/bookings${params}`);
      return response.data as Booking[];
    },
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: async () => {
      const response = await api.get(`/bookings/${id}`);
      return response.data as Booking;
    },
    enabled: !!id,
  });
}

export function useAcceptQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await api.patch(`/bookings/${bookingId}/accept`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

export function useDeclineQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await api.patch(`/bookings/${bookingId}/decline`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}
```

### 44.2 Wedding Setup Flow

Create `components/wedding-setup.tsx`:

Multi-step onboarding modal/screen shown when user has no wedding:

**Step 1: Wedding Date**
- Date picker (native)
- "When is your wedding?" header
- Skip option for undecided

**Step 2: Partner Info**
- Partner's name text input
- "Who are you marrying?" header

**Step 3: Guest Estimate**
- Number input or slider (50, 100, 150, 200, 300+)
- "How many guests?" header

**Step 4: Venue (Optional)**
- Text input for venue name
- "Do you have a venue?" header
- Skip button

**Step 5: Style Preferences**
- Multi-select chips: Traditional, Modern, Rustic, Elegant, Bohemian, Classic, etc.
- "What's your style?" header

Each step:
- Animated progress indicator at top (step X of 5)
- Back/Next buttons
- Animated transitions between steps (Reanimated slide)
- All text via `t()` from `wedding.*` translation keys
- All colors from theme

On final step, submit via `useCreateWedding()` mutation. Show success with haptic feedback.

### 44.3 Wedding Dashboard

Update **app/(main)/index.tsx** to show wedding dashboard when wedding exists:

```typescript
// Pattern:
const { data: wedding, isLoading: weddingLoading } = useWedding();
const { data: stats, isLoading: statsLoading } = useWeddingStats();

// If no wedding exists and not loading, show setup prompt
// If wedding exists, show dashboard
```

**Dashboard sections:**

1. **Countdown Card:**
   - Large countdown number (days until wedding)
   - Wedding date below
   - Animated gradient background using `expo-linear-gradient` with brand colors
   - Partner name (e.g., "John & Jane's Wedding")

2. **Quick Stats Row** (4 items in a 2x2 grid):
   - Vendors Booked: count with calendar icon
   - Guests Confirmed: count with people icon
   - Budget Spent: percentage with wallet icon
   - Tasks Done: percentage with checkmark icon
   - Each stat card: icon, label (localized), value
   - Colors from theme (brand for positive, warning for attention-needed)

3. **Upcoming Tasks** (next 5 from checklist):
   - Task card: checkbox, title, due date, category badge
   - "View All" link → planner tab
   - From `useChecklist()` hook (to be created, or placeholder)

4. **Recent Activity Feed:**
   - Timeline of recent events: new RSVPs, vendor messages, booking status changes
   - Each item: icon, description, timestamp
   - From activity/notifications API

5. **Quick Actions Row:**
   - "Add Guest" → planner tab (guests section)
   - "Check Budget" → planner tab (budget section)
   - "Find Vendors" → search tab
   - "View Checklist" → planner tab (checklist section)
   - Each action: icon + label in a horizontal scroll or grid

All sections with loading skeletons and pull-to-refresh.

### 44.4 Bookings Tab

Rewrite **app/(main)/bookings.tsx:**

- **Booking list** with status filter tabs at top: All, Inquiries, Quoted, Booked, Completed
- Each booking card:
  - Vendor cover image (small thumbnail)
  - Vendor business name
  - Category
  - Status badge (color-coded using semantic colors from theme):
    - INQUIRY: `bg-info-50 text-info-700`
    - QUOTED: `bg-warning-50 text-warning-700`
    - BOOKED: `bg-success-50 text-success-700`
    - COMPLETED: `bg-surface-tertiary text-content-secondary`
    - CANCELLED: `bg-danger-50 text-danger-700`
  - Date of inquiry
  - Quoted price (if quoted)
- Tap booking → booking detail screen
- Empty state: "No bookings yet" with "Find Vendors" button
- Pull-to-refresh

### 44.5 Booking Detail Screen

Create **app/(main)/booking/[id].tsx** (stack push from bookings list):

- Vendor info header: image, name, category
- Status timeline: visual vertical timeline showing status progression
  - Each step: dot (filled/empty), label, date (if reached)
  - Current step highlighted with brand color
- **Details section:**
  - Wedding date
  - Guest count
  - Original message
  - Quoted price (if quoted)
- **Actions** (context-dependent):
  - If QUOTED: "Accept Quote" (brand button with haptic), "Decline" (outline button)
  - If BOOKED: "Message Vendor" button
  - If any status: "Message Vendor" button
- Accept/decline calls mutations with success haptic feedback
- Confirmation alert before accept/decline

### 44.6 My Vendors Section

Add to home dashboard or as a section within bookings:

- Grid of booked vendors (status = BOOKED)
- Each card: vendor avatar/image, name, category, status
- Quick "Message" button per vendor
- "Find More Vendors" button at bottom → search tab

## Acceptance Criteria
- [ ] Wedding setup flow appears when user has no wedding
- [ ] Multi-step form validates and submits to real API
- [ ] Animated step transitions work smoothly
- [ ] Dashboard shows countdown card with days until wedding
- [ ] Quick stats row shows vendors booked, guests, budget, tasks from API
- [ ] Upcoming tasks section loads from API
- [ ] Quick action buttons navigate to correct screens
- [ ] Bookings tab shows list of bookings with status filter tabs
- [ ] Booking cards show vendor info, status badge, date, price
- [ ] Booking detail screen shows status timeline
- [ ] Accept/decline quote actions call real API and update UI
- [ ] Haptic feedback on accept (success) and decline (heavy)
- [ ] My vendors grid shows booked vendors
- [ ] Pull-to-refresh on dashboard and bookings
- [ ] Loading skeletons on all data-loading sections
- [ ] Empty states with action buttons
- [ ] All text via `t()` — no hardcoded strings
- [ ] All colors from NativeWind theme — no hardcoded colors
- [ ] TypeScript compiles with 0 errors

## Files to Create/Modify
- `apps/mobile/hooks/api/use-wedding.ts` (create)
- `apps/mobile/hooks/api/use-bookings.ts` (create)
- `apps/mobile/components/wedding-setup.tsx` (create)
- `apps/mobile/components/countdown-card.tsx` (create)
- `apps/mobile/components/stat-card.tsx` (create)
- `apps/mobile/components/booking-card.tsx` (create)
- `apps/mobile/components/status-badge.tsx` (create)
- `apps/mobile/components/status-timeline.tsx` (create)
- `apps/mobile/app/(main)/index.tsx` (rewrite — wedding dashboard)
- `apps/mobile/app/(main)/bookings.tsx` (rewrite)
- `apps/mobile/app/(main)/booking/[id].tsx` (create)
- `apps/mobile/i18n/en.json` (update with any new keys)
- `apps/mobile/i18n/am.json` (update with any new keys)

## Dependencies
- Task 41: Mobile App Scaffolding
- Task 42: Mobile Auth
- Task 43: Mobile Search (vendor cards, skeletons, empty states)
