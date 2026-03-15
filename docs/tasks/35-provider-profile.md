# Task 35: Provider Portal — Profile & Portfolio Management

## Summary
Build the profile editing page (tabbed layout with general info, packages, FAQs, availability) and the portfolio management page (upload, reorder, manage media items). These are core provider features for managing their directory listing.

## Current State
- Provider portal has layout with sidebar, header, routing (Task 34)
- ProfilePage and PortfolioPage are placeholders
- Backend endpoints available:
  - Profile: `GET /api/v1/providers/me`, `PATCH /api/v1/providers/me`
  - Packages: `GET /api/v1/providers/me/packages`, `POST/PATCH/DELETE /api/v1/providers/me/packages/:id`
  - FAQs: `GET /api/v1/providers/me/faqs`, `POST/PATCH/DELETE /api/v1/providers/me/faqs/:id`
  - Availability: `GET /api/v1/providers/me/availability`, `PATCH /api/v1/providers/me/availability`
  - Portfolio: `GET /api/v1/providers/me/portfolio`, `POST/PATCH/DELETE /api/v1/providers/me/portfolio/:id`
  - Uploads: `POST /api/v1/uploads/presigned-url`, `POST /api/v1/uploads/confirm`
- Tenant context is propagated via X-Tenant-ID header from Task 34

## Required Changes

### 35.1 Install Dependencies

```bash
cd apps/provider-portal && npm install date-fns @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

- `date-fns` — date formatting and calendar utilities
- `@dnd-kit/*` — drag and drop for reordering packages, FAQs, portfolio items

### 35.2 Profile Types

Create `apps/provider-portal/src/features/profile/types.ts`:

```typescript
export interface ProviderProfile {
  id: string;
  businessName: string;
  description: string;
  category: string;
  location: string;
  city: string;
  state: string;
  styles: string[];
  languages: string[];
  phone: string;
  email: string;
  website: string;
  logoUrl: string | null;
  coverPhotoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  priceType: 'fixed' | 'starting_from' | 'hourly' | 'custom';
  duration: string;
  inclusions: string[];
  sortOrder: number;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
}

export interface AvailabilityDate {
  date: string; // ISO date string
  status: 'available' | 'booked' | 'blocked';
}

export interface PortfolioItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl: string | null;
  title: string;
  description: string;
  eventDate: string | null;
  venue: string | null;
  isCover: boolean;
  sortOrder: number;
}
```

### 35.3 Profile Schemas

Create `apps/provider-portal/src/features/profile/schemas.ts`:

```typescript
import { z } from 'zod';

export const profileSchema = z.object({
  businessName: z.string().min(2, 'Business name is required').max(100),
  description: z.string().max(2000).optional(),
  category: z.string().min(1, 'Category is required'),
  location: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  styles: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
});

export const packageSchema = z.object({
  name: z.string().min(1, 'Package name is required').max(100),
  description: z.string().max(1000).optional(),
  price: z.number().min(0, 'Price must be positive'),
  priceType: z.enum(['fixed', 'starting_from', 'hourly', 'custom']),
  duration: z.string().max(100).optional(),
  inclusions: z.array(z.string()),
});

export const faqSchema = z.object({
  question: z.string().min(1, 'Question is required').max(500),
  answer: z.string().min(1, 'Answer is required').max(2000),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
export type PackageFormData = z.infer<typeof packageSchema>;
export type FAQFormData = z.infer<typeof faqSchema>;
```

### 35.4 TanStack Query Hooks

Create `apps/provider-portal/src/features/profile/hooks/use-profile.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ProviderProfile, Package, FAQ, AvailabilityDate, PortfolioItem } from '../types';

// Profile
export function useProfileQuery() {
  return useQuery({
    queryKey: ['provider-profile'],
    queryFn: async () => {
      const response = await api.get<{ data: ProviderProfile }>('/providers/me');
      return response.data.data;
    },
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<ProviderProfile>) => {
      const response = await api.patch<{ data: ProviderProfile }>('/providers/me', data);
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provider-profile'] }),
  });
}

// Packages
export function usePackagesQuery() {
  return useQuery({
    queryKey: ['provider-packages'],
    queryFn: async () => {
      const response = await api.get<{ data: Package[] }>('/providers/me/packages');
      return response.data.data;
    },
  });
}

export function useCreatePackageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Package, 'id' | 'sortOrder'>) => {
      const response = await api.post<{ data: Package }>('/providers/me/packages', data);
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provider-packages'] }),
  });
}

export function useUpdatePackageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Package> & { id: string }) => {
      const response = await api.patch<{ data: Package }>(`/providers/me/packages/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provider-packages'] }),
  });
}

export function useDeletePackageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/providers/me/packages/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provider-packages'] }),
  });
}

export function useReorderPackagesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      await api.patch('/providers/me/packages/reorder', { ids: orderedIds });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provider-packages'] }),
  });
}

// FAQs — same CRUD pattern as packages
export function useFAQsQuery() { /* ... */ }
export function useCreateFAQMutation() { /* ... */ }
export function useUpdateFAQMutation() { /* ... */ }
export function useDeleteFAQMutation() { /* ... */ }
export function useReorderFAQsMutation() { /* ... */ }

// Availability
export function useAvailabilityQuery(month: string) {
  return useQuery({
    queryKey: ['provider-availability', month],
    queryFn: async () => {
      const response = await api.get<{ data: AvailabilityDate[] }>(`/providers/me/availability?month=${month}`);
      return response.data.data;
    },
  });
}

export function useUpdateAvailabilityMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dates: Array<{ date: string; status: string }>) => {
      await api.patch('/providers/me/availability', { dates });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provider-availability'] }),
  });
}

// Portfolio
export function usePortfolioQuery() { /* ... */ }
export function useCreatePortfolioItemMutation() { /* ... */ }
export function useUpdatePortfolioItemMutation() { /* ... */ }
export function useDeletePortfolioItemMutation() { /* ... */ }
export function useReorderPortfolioMutation() { /* ... */ }
```

### 35.5 Profile Page — Tabbed Layout

Replace `apps/provider-portal/src/features/profile/profile-page.tsx`:

```typescript
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeneralInfoTab } from './components/general-info-tab';
import { PackagesTab } from './components/packages-tab';
import { FAQsTab } from './components/faqs-tab';
import { AvailabilityTab } from './components/availability-tab';

export function ProfilePage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{t('profile.title')}</h1>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">{t('profile.generalInfo')}</TabsTrigger>
          <TabsTrigger value="packages">{t('profile.packages')}</TabsTrigger>
          <TabsTrigger value="faqs">{t('profile.faqs')}</TabsTrigger>
          <TabsTrigger value="availability">{t('profile.availability')}</TabsTrigger>
        </TabsList>

        <TabsContent value="general"><GeneralInfoTab /></TabsContent>
        <TabsContent value="packages"><PackagesTab /></TabsContent>
        <TabsContent value="faqs"><FAQsTab /></TabsContent>
        <TabsContent value="availability"><AvailabilityTab /></TabsContent>
      </Tabs>
    </div>
  );
}
```

### 35.6 General Info Tab

Create `apps/provider-portal/src/features/profile/components/general-info-tab.tsx`:

- Card with form fields: business name, description (textarea), category (select), location, city, state, styles (multi-select/tags), languages (multi-select/tags), phone, email, website
- Logo upload area (click to upload, shows current logo)
- Cover photo upload area
- Save button at bottom
- Fetch current profile on mount with `useProfileQuery()`
- Submit calls `useUpdateProfileMutation()`
- Zod validation on submit
- Toast success/error

For image upload, create a reusable `ImageUpload` component:
```typescript
// components/image-upload.tsx
// 1. Get presigned URL: POST /api/v1/uploads/presigned-url { filename, contentType }
// 2. Upload file to presigned URL (PUT to MinIO/S3)
// 3. Confirm upload: POST /api/v1/uploads/confirm { key }
// 4. Returns the public URL
```

### 35.7 Packages Tab

Create `apps/provider-portal/src/features/profile/components/packages-tab.tsx`:

- List of package cards (sortable via @dnd-kit)
- Each card shows: name, price (formatted), price type, description, inclusions list
- "Add Package" button opens dialog
- Edit/Delete actions per card
- Drag handle for reordering
- Package form dialog fields: name, description, price (number input), price type (select: fixed/starting_from/hourly/custom), duration, inclusions (dynamic list — add/remove items)

**Inclusions list pattern** in the dialog:
```typescript
// Dynamic list of string inputs
const [inclusions, setInclusions] = useState<string[]>([]);

// Add item
<Button onClick={() => setInclusions([...inclusions, ''])}>Add Inclusion</Button>

// Each item has an input + remove button
{inclusions.map((item, index) => (
  <div key={index} className="flex gap-2">
    <Input value={item} onChange={(e) => updateInclusion(index, e.target.value)} />
    <Button variant="ghost" size="icon" onClick={() => removeInclusion(index)}>
      <X className="h-4 w-4" />
    </Button>
  </div>
))}
```

### 35.8 FAQs Tab

Create `apps/provider-portal/src/features/profile/components/faqs-tab.tsx`:

- List of FAQ items (sortable via @dnd-kit)
- Each item shows question as title, answer as collapsible content (Accordion)
- "Add FAQ" button opens dialog
- Edit/Delete actions per item
- FAQ form dialog: question (input), answer (textarea)
- Drag handle for reordering

### 35.9 Availability Tab

Create `apps/provider-portal/src/features/profile/components/availability-tab.tsx`:

- Month calendar view (custom calendar grid component)
- Navigation: prev/next month buttons with month/year display
- Each day cell shows colored indicator:
  - Available: green
  - Booked: blue (cannot change)
  - Blocked: red/gray
- Click on available date → toggle to blocked (and vice versa)
- Cannot click on booked dates
- "Block Date Range" button: opens dialog with start/end date inputs to bulk-block
- Save changes button (batches all changes and submits)

Calendar grid implementation:
```typescript
import { startOfMonth, endOfMonth, eachDayOfInterval, format, addMonths, subMonths, getDay, isSameMonth } from 'date-fns';

function CalendarGrid({ month, availability, onDateClick }: CalendarGridProps) {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const days = eachDayOfInterval({ start, end });
  const startDay = getDay(start); // 0=Sun

  return (
    <div className="grid grid-cols-7 gap-1">
      {/* Day headers */}
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
        <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">{day}</div>
      ))}
      {/* Empty cells for offset */}
      {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
      {/* Day cells */}
      {days.map((day) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const status = availability.find((a) => a.date === dateStr)?.status ?? 'available';
        return (
          <button
            key={dateStr}
            onClick={() => onDateClick(dateStr, status)}
            disabled={status === 'booked'}
            className={cn(
              'aspect-square rounded-md text-sm flex items-center justify-center',
              status === 'available' && 'bg-green-100 hover:bg-green-200 dark:bg-green-900/30',
              status === 'booked' && 'bg-blue-100 cursor-not-allowed dark:bg-blue-900/30',
              status === 'blocked' && 'bg-red-100 hover:bg-red-200 dark:bg-red-900/30',
            )}
          >
            {format(day, 'd')}
          </button>
        );
      })}
    </div>
  );
}
```

### 35.10 Portfolio Page

Replace `apps/provider-portal/src/features/portfolio/portfolio-page.tsx`:

- Grid of portfolio items (responsive: 1 col mobile, 2 col tablet, 3-4 col desktop)
- Each item: thumbnail image, title overlay, hover actions (edit, delete, set cover)
- Cover photo has a "Cover" badge
- "Upload" button opens file upload zone
- Upload zone: drag & drop area with click-to-browse, accepts images (jpg, png, webp) and videos (mp4), max file size 10MB
- Multi-file upload with progress indicators
- Edit item dialog: title, description, event date (date picker), venue
- Delete with confirmation
- Reorder via drag and drop (@dnd-kit grid)

**File upload flow**:
```typescript
async function uploadFile(file: File): Promise<string> {
  // 1. Get presigned URL
  const { data } = await api.post('/uploads/presigned-url', {
    filename: file.name,
    contentType: file.type,
  });
  const { uploadUrl, key } = data.data;

  // 2. Upload to presigned URL
  await axios.put(uploadUrl, file, {
    headers: { 'Content-Type': file.type },
    onUploadProgress: (progressEvent) => {
      const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total ?? 1));
      setProgress(prev => ({ ...prev, [file.name]: percent }));
    },
  });

  // 3. Confirm upload
  const confirmed = await api.post('/uploads/confirm', { key });
  return confirmed.data.data.url;
}
```

**Drag and drop upload zone component**:
```typescript
function DropZone({ onFilesSelected }: { onFilesSelected: (files: File[]) => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        onFilesSelected(Array.from(e.dataTransfer.files));
      }}
      onClick={() => inputRef.current?.click()}
      className={cn(
        'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
        isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
      )}
    >
      <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
      <p className="mt-2 text-sm text-muted-foreground">{t('portfolio.dragDrop')}</p>
      <input ref={inputRef} type="file" multiple accept="image/*,video/mp4" className="hidden"
        onChange={(e) => onFilesSelected(Array.from(e.target.files ?? []))} />
    </div>
  );
}
```

## Acceptance Criteria
- [ ] Profile page renders with 4 tabs: General Info, Packages, FAQs, Availability
- [ ] General Info tab: form loads current profile, validates with Zod, saves on submit, shows toast
- [ ] Logo and cover photo upload works via presigned URL flow
- [ ] Packages tab: list packages as cards, create/edit/delete with dialogs, drag-to-reorder
- [ ] Package form: name, description, price, price type, duration, dynamic inclusions list
- [ ] FAQs tab: list FAQs, create/edit/delete, drag-to-reorder
- [ ] Availability tab: month calendar view, toggle available/blocked by clicking, bulk block date range
- [ ] Portfolio page: grid of items, upload via drag & drop with progress, edit/delete items
- [ ] Portfolio: set cover photo, reorder items via drag and drop
- [ ] File uploads use presigned URL flow (presigned → upload → confirm)
- [ ] All mutations show toast success/error notifications
- [ ] All strings from i18n translation files
- [ ] Provider portal builds with 0 errors

## Files to Create/Modify
- `apps/provider-portal/src/features/profile/types.ts` (create)
- `apps/provider-portal/src/features/profile/schemas.ts` (create)
- `apps/provider-portal/src/features/profile/hooks/use-profile.ts` (create)
- `apps/provider-portal/src/features/profile/profile-page.tsx` (replace)
- `apps/provider-portal/src/features/profile/components/general-info-tab.tsx` (create)
- `apps/provider-portal/src/features/profile/components/packages-tab.tsx` (create)
- `apps/provider-portal/src/features/profile/components/faqs-tab.tsx` (create)
- `apps/provider-portal/src/features/profile/components/availability-tab.tsx` (create)
- `apps/provider-portal/src/features/portfolio/portfolio-page.tsx` (replace)
- `apps/provider-portal/src/features/portfolio/types.ts` (create — or reuse from profile/types)
- `apps/provider-portal/src/features/portfolio/hooks/use-portfolio.ts` (create)
- `apps/provider-portal/src/features/portfolio/components/drop-zone.tsx` (create)
- `apps/provider-portal/src/features/portfolio/components/portfolio-item-card.tsx` (create)
- `apps/provider-portal/src/features/portfolio/components/edit-item-dialog.tsx` (create)
- `apps/provider-portal/src/components/image-upload.tsx` (create — reusable)
- `apps/provider-portal/src/i18n/en.json` (modify — ensure profile/portfolio translations)

## Dependencies
- Task 28 (Frontend Shared Foundation) — shadcn/ui components (Tabs, Card, Dialog, Input, etc.)
- Task 29 (Frontend i18n) — translation strings
- Task 30 (Frontend Auth) — auth store, API client
- Task 34 (Provider Layout) — DashboardLayout, sidebar routing, tenant context
