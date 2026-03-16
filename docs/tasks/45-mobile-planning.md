# Task 45: Mobile Planning Tools — Guest List, Budget, Checklist, Messages

## Summary
Build the wedding planning tools within the Planner tab: checklist with swipe-to-complete, guest list management with RSVP tracking, budget tracker with charts, and vendor messaging. All data from real API endpoints with full CRUD operations.

## Current State
- Tasks 41-44 provide scaffolding, auth, search, and wedding dashboard
- Planner tab exists with placeholder content
- Backend has checklist, guest, budget, and messaging endpoints
- Reanimated is installed for gesture-based interactions
- No chart library installed yet

## Required Changes

### 45.1 Install Chart Dependencies

Add to `apps/mobile/package.json`:

```json
{
  "dependencies": {
    "react-native-svg": "^15.11.2",
    "victory-native": "^41.12.1"
  }
}
```

### 45.2 Planner Tab with Sub-Navigation

Rewrite **app/(main)/planner.tsx** as a screen with top tabs (segmented control):

```typescript
import { useState } from 'react';
import { View, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

type PlannerTab = 'checklist' | 'guests' | 'budget';

export default function PlannerScreen() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<PlannerTab>('checklist');

  const tabs: { key: PlannerTab; label: string }[] = [
    { key: 'checklist', label: t('planner.checklist') },
    { key: 'guests', label: t('planner.guests') },
    { key: 'budget', label: t('planner.budget') },
  ];

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <Text className="px-4 pt-4 text-2xl font-bold text-content">
        {t('planner.title')}
      </Text>

      {/* Segmented control */}
      <View className="mx-4 mt-4 flex-row rounded-button bg-surface-secondary p-1">
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            className={`flex-1 rounded-button py-2 ${
              activeTab === tab.key ? 'bg-brand-600' : ''
            }`}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              className={`text-center text-sm font-medium ${
                activeTab === tab.key ? 'text-content-inverse' : 'text-content-secondary'
              }`}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      {activeTab === 'checklist' && <ChecklistView />}
      {activeTab === 'guests' && <GuestListView />}
      {activeTab === 'budget' && <BudgetView />}
    </SafeAreaView>
  );
}
```

### 45.3 API Hooks

**hooks/api/use-checklist.ts:**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface ChecklistTask {
  id: string;
  title: string;
  dueDate: string | null;
  category: string;
  isCompleted: boolean;
  completedAt: string | null;
  sortOrder: number;
}

export function useChecklist(filter?: 'all' | 'overdue' | 'upcoming' | 'completed') {
  return useQuery({
    queryKey: ['checklist', filter],
    queryFn: async () => {
      const params = filter && filter !== 'all' ? `?filter[status]=${filter}` : '';
      const response = await api.get(`/wedding/checklist${params}`);
      return response.data as ChecklistTask[];
    },
  });
}

export function useToggleTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isCompleted }: { id: string; isCompleted: boolean }) => {
      const response = await api.patch(`/wedding/checklist/${id}`, { isCompleted });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist'] });
      queryClient.invalidateQueries({ queryKey: ['wedding', 'stats'] });
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { title: string; dueDate?: string; category?: string }) => {
      const response = await api.post('/wedding/checklist', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist'] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/wedding/checklist/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist'] });
    },
  });
}
```

**hooks/api/use-guests.ts:**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Guest {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  side: 'bride' | 'groom' | 'both';
  relationship: string;
  rsvpStatus: 'pending' | 'attending' | 'declined';
  mealChoice: string | null;
  plusOne: boolean;
  events: string[];
}

interface GuestSummary {
  total: number;
  attending: number;
  declined: number;
  pending: number;
}

export function useGuests(search?: string) {
  return useQuery({
    queryKey: ['guests', search],
    queryFn: async () => {
      const params = search ? `?filter[name][contains]=${search}` : '';
      const response = await api.get(`/wedding/guests${params}`);
      return response.data as Guest[];
    },
  });
}

export function useGuestSummary() {
  return useQuery({
    queryKey: ['guests', 'summary'],
    queryFn: async () => {
      const response = await api.get('/wedding/guests/summary');
      return response.data as GuestSummary;
    },
  });
}

export function useCreateGuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Guest, 'id'>) => {
      const response = await api.post('/wedding/guests', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
    },
  });
}

export function useUpdateGuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Guest> & { id: string }) => {
      const response = await api.patch(`/wedding/guests/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
    },
  });
}

export function useDeleteGuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/wedding/guests/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
    },
  });
}
```

**hooks/api/use-budget.ts:**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface BudgetCategory {
  id: string;
  name: string;
  estimatedAmount: number;
  spentAmount: number;
  items: BudgetItem[];
}

interface BudgetItem {
  id: string;
  categoryId: string;
  description: string;
  amount: number;
  isPaid: boolean;
  paidDate: string | null;
  vendorName: string | null;
}

interface BudgetOverview {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  categories: BudgetCategory[];
}

export function useBudgetOverview() {
  return useQuery({
    queryKey: ['budget', 'overview'],
    queryFn: async () => {
      const response = await api.get('/wedding/budget');
      return response.data as BudgetOverview;
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      categoryId: string;
      description: string;
      amount: number;
      vendorName?: string;
    }) => {
      const response = await api.post('/wedding/budget/expenses', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      queryClient.invalidateQueries({ queryKey: ['wedding', 'stats'] });
    },
  });
}
```

**hooks/api/use-messages.ts:**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Conversation {
  id: string;
  vendorId: string;
  vendor: {
    id: string;
    businessName: string;
    coverImage: string | null;
  };
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'client' | 'vendor';
  content: string;
  createdAt: string;
}

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await api.get('/messages/conversations');
      return response.data as Conversation[];
    },
  });
}

export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const response = await api.get(`/messages/conversations/${conversationId}`);
      return response.data as Message[];
    },
    enabled: !!conversationId,
    refetchInterval: 10000, // Poll every 10 seconds when chat is open
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { conversationId: string; content: string }) => {
      const response = await api.post(
        `/messages/conversations/${data.conversationId}`,
        { content: data.content },
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['messages', variables.conversationId],
      });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
```

### 45.4 Checklist View

**components/planner/checklist-view.tsx:**

- **Progress bar** at top: `{{done}} of {{total}} tasks completed` with animated progress fill
- **Filter tabs:** All, Overdue, Upcoming, Completed
- **Task list** (FlatList):
  - Task card: checkbox (animated), title, due date, category badge
  - Checkbox toggles via `useToggleTask()` mutation
  - Haptic feedback on toggle (success type)
  - Swipe-to-complete using Reanimated gesture handler:
    ```typescript
    // Swipe right reveals green checkmark, releases to complete
    // Use react-native-gesture-handler PanGestureHandler
    // with Reanimated interpolation for the background reveal
    ```
  - Tasks grouped by month (relative to wedding date) with section headers
- **Add Task button** (floating or header):
  - Bottom sheet with: task name, due date (date picker), category (dropdown)
  - Submit via `useCreateTask()` mutation
- **Empty state** when no tasks
- Pull-to-refresh
- All text via `t()` from `checklist.*` keys

### 45.5 Guest List View

**components/planner/guest-list-view.tsx:**

- **RSVP Summary header:**
  - Three stat cards in a row: Attending (green), Declined (red), Pending (yellow)
  - Total guest count
  - Data from `useGuestSummary()`
- **Search input** to filter guests by name
- **Guest list** (FlatList):
  - Guest card: name, relationship, RSVP status badge, meal choice icon
  - Status badge colors from semantic theme tokens:
    - attending: `bg-success-50 text-success-700`
    - declined: `bg-danger-50 text-danger-700`
    - pending: `bg-warning-50 text-warning-700`
  - Swipe left to delete (with confirmation alert + heavy haptic)
  - Swipe right to edit (opens edit bottom sheet)
- **Add Guest button:**
  - Bottom sheet form: name, email, phone, side (bride/groom/both), relationship, events multi-select
  - Zod validation
  - Submit via `useCreateGuest()` mutation
  - Haptic feedback on success
- **Empty state:** "No guests added yet" with add button
- Pull-to-refresh

### 45.6 Budget View

**components/planner/budget-view.tsx:**

- **Budget header:**
  - Total budget amount (large text)
  - Progress ring/bar showing spent vs remaining
  - Spent amount and remaining amount below
  - Colors: spent = brand, remaining = success (if under) or danger (if over)
- **Pie chart** (using victory-native):
  - Category breakdown
  - Legend with category name, amount, percentage
  - All chart colors derived from brand palette (brand-200 through brand-900)
  ```typescript
  import { VictoryPie, VictoryLabel } from 'victory-native';

  <VictoryPie
    data={categories.map((c) => ({
      x: c.name,
      y: c.spentAmount,
    }))}
    colorScale={['#bac8ff', '#91a7ff', '#748ffc', '#5c7cfa', '#4c6ef5', '#4263eb']}
    innerRadius={60}
    labelRadius={90}
    style={{ labels: { fontSize: 12, fill: '#495057' } }}
  />
  ```
- **Category cards** (FlatList):
  - Category name, estimated amount, spent amount
  - Progress bar (spent / estimated)
  - Tap category → expands to show line items
  - Each line item: description, amount, paid status, vendor name
- **Add Expense button:**
  - Bottom sheet form: category (select from existing), description, amount, vendor name (optional)
  - Submit via `useCreateExpense()` mutation
- **Empty state** when no budget set

### 45.7 Messages Screen

Create a separate messages flow accessible from the Planner tab or from booking details:

**components/planner/messages-view.tsx** (or accessible from a separate icon/route):

Since messages is a sub-feature, implement as either:
- A fourth segment in the Planner tab
- OR a separate screen accessible from booking detail and a "Messages" quick action

**Conversation List:**
- Vendor avatar (or placeholder), business name, last message preview, timestamp
- Unread count badge (brand color)
- Tap → opens chat thread
- Empty state: "No messages yet"

**Chat Thread** (push onto stack — create `app/(main)/chat/[conversationId].tsx`):
- Header: vendor name, back button
- Message list (FlatList inverted for chat):
  - Sent messages: right-aligned, brand-600 background, inverse text
  - Received messages: left-aligned, surface-secondary background, content text
  - Timestamp below each message group
- Text input + send button at bottom
- KeyboardAvoidingView for proper keyboard handling
- Send via `useSendMessage()` mutation
- Light haptic on send
- Auto-scroll to bottom on new message
- Polling every 10 seconds via `refetchInterval: 10000` on `useMessages()`
- Pull up to load older messages

### 45.8 Planner Navigation Updates

Add messages access point. Options:
1. Add "Messages" as a 4th segment in the planner segmented control
2. Add a messages icon button in the planner header that navigates to a messages list screen

Also create the chat route:

```
app/(main)/
├── chat/
│   └── [conversationId].tsx   # Chat thread screen
```

## Acceptance Criteria
- [ ] Planner tab shows segmented control with Checklist, Guests, Budget
- [ ] Checklist shows tasks grouped by month with progress bar
- [ ] Checklist filter tabs (All, Overdue, Upcoming, Completed) work
- [ ] Task checkbox toggles via real API call
- [ ] Swipe-to-complete gesture works with Reanimated
- [ ] Add task bottom sheet creates task via API
- [ ] Haptic feedback on task completion (success)
- [ ] Guest list shows RSVP summary (attending/declined/pending)
- [ ] Guest search filters the list
- [ ] Add guest form validates with Zod and submits to API
- [ ] Swipe actions on guests (edit/delete) work
- [ ] Delete guest has confirmation alert with heavy haptic
- [ ] Budget header shows total, spent, remaining with progress
- [ ] Pie chart renders category breakdown with victory-native
- [ ] Category cards show progress bars and expand to line items
- [ ] Add expense bottom sheet submits to API
- [ ] Conversation list shows vendor conversations with unread badges
- [ ] Chat thread shows message bubbles (sent/received)
- [ ] Send message works via API
- [ ] Chat polls for new messages every 10 seconds
- [ ] Pull-to-refresh on all views
- [ ] Loading skeletons on all data sections
- [ ] Empty states with appropriate messages and action buttons
- [ ] All text via `t()` — no hardcoded strings
- [ ] All colors from NativeWind theme — no hardcoded colors
- [ ] TypeScript compiles with 0 errors

## Files to Create/Modify
- `apps/mobile/hooks/api/use-checklist.ts` (create)
- `apps/mobile/hooks/api/use-guests.ts` (create)
- `apps/mobile/hooks/api/use-budget.ts` (create)
- `apps/mobile/hooks/api/use-messages.ts` (create)
- `apps/mobile/components/planner/checklist-view.tsx` (create)
- `apps/mobile/components/planner/guest-list-view.tsx` (create)
- `apps/mobile/components/planner/budget-view.tsx` (create)
- `apps/mobile/components/planner/messages-view.tsx` (create)
- `apps/mobile/components/planner/add-task-sheet.tsx` (create)
- `apps/mobile/components/planner/add-guest-sheet.tsx` (create)
- `apps/mobile/components/planner/add-expense-sheet.tsx` (create)
- `apps/mobile/app/(main)/planner.tsx` (rewrite)
- `apps/mobile/app/(main)/chat/[conversationId].tsx` (create)
- `apps/mobile/i18n/en.json` (update with any new keys)
- `apps/mobile/i18n/am.json` (update with any new keys)
- `apps/mobile/package.json` (add react-native-svg, victory-native)

## Dependencies
- Task 41: Mobile App Scaffolding
- Task 42: Mobile Auth
- Task 43: Mobile Search (reusable components)
- Task 44: Mobile Dashboard (wedding hooks, booking hooks)
