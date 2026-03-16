# Task 43: Mobile Public Screens — Vendor Search, Vendor Profile, Categories

## Summary
Build the vendor discovery experience: home dashboard with categories and featured vendors, full-text search with filters and infinite scroll, detailed vendor profile with portfolio/packages/reviews, inquiry form, and category browsing. All data from real API endpoints via Meilisearch and backend REST endpoints.

## Current State
- Task 41 scaffolded the app with NativeWind, i18n, API client, auth store
- Task 42 implemented auth screens and 5-tab navigation (Home, Search, Bookings, Planner, Profile)
- Home and Search tabs have placeholder content
- Backend has: `GET /api/v1/search` (Meilisearch), vendor/provider endpoints, review endpoints, category endpoints
- Backend query parameters use bracket notation: `filter[status]=active&filter[category]=photography&sort=-rating&page=1&pageSize=20`

## Required Changes

### 43.1 API Hooks

Create `hooks/api/` directory with TanStack Query hooks:

**hooks/api/use-search.ts:**

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface SearchParams {
  query?: string;
  category?: string;
  priceMin?: number;
  priceMax?: number;
  ratingMin?: number;
  sort?: string;
}

interface Vendor {
  id: string;
  businessName: string;
  slug: string;
  category: string;
  description: string;
  location: string;
  rating: number;
  reviewCount: number;
  startingPrice: number | null;
  coverImage: string | null;
  isVerified: boolean;
}

interface PaginatedResponse {
  data: Vendor[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export function useSearchVendors(params: SearchParams) {
  return useInfiniteQuery({
    queryKey: ['vendors', 'search', params],
    queryFn: async ({ pageParam = 1 }) => {
      const searchParams = new URLSearchParams();
      if (params.query) searchParams.set('q', params.query);
      if (params.category) searchParams.set('filter[category]', params.category);
      if (params.priceMin) searchParams.set('filter[startingPrice][gte]', String(params.priceMin));
      if (params.priceMax) searchParams.set('filter[startingPrice][lte]', String(params.priceMax));
      if (params.ratingMin) searchParams.set('filter[rating][gte]', String(params.ratingMin));
      if (params.sort) searchParams.set('sort', params.sort);
      searchParams.set('page', String(pageParam));
      searchParams.set('pageSize', '20');

      const response = await api.get(`/search?${searchParams.toString()}`);
      return response.data as PaginatedResponse;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
}
```

**hooks/api/use-vendors.ts:**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useVendor(id: string) {
  return useQuery({
    queryKey: ['vendor', id],
    queryFn: async () => {
      const response = await api.get(`/providers/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useVendorPortfolio(vendorId: string) {
  return useQuery({
    queryKey: ['vendor', vendorId, 'portfolio'],
    queryFn: async () => {
      const response = await api.get(`/providers/${vendorId}/portfolio`);
      return response.data;
    },
    enabled: !!vendorId,
  });
}

export function useVendorPackages(vendorId: string) {
  return useQuery({
    queryKey: ['vendor', vendorId, 'packages'],
    queryFn: async () => {
      const response = await api.get(`/providers/${vendorId}/packages`);
      return response.data;
    },
    enabled: !!vendorId,
  });
}

export function useVendorReviews(vendorId: string) {
  return useQuery({
    queryKey: ['vendor', vendorId, 'reviews'],
    queryFn: async () => {
      const response = await api.get(`/providers/${vendorId}/reviews`);
      return response.data;
    },
    enabled: !!vendorId,
  });
}

export function useFeaturedVendors() {
  return useQuery({
    queryKey: ['vendors', 'featured'],
    queryFn: async () => {
      const response = await api.get('/providers?filter[isFeatured]=true&pageSize=10');
      return response.data;
    },
  });
}

export function useSendInquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      vendorId: string;
      weddingDate?: string;
      guestCount?: number;
      message: string;
      budgetRange?: string;
    }) => {
      const response = await api.post('/bookings/inquiries', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}
```

**hooks/api/use-categories.ts:**

```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories');
      return response.data;
    },
    staleTime: 1000 * 60 * 30, // Categories rarely change
  });
}
```

### 43.2 Reusable Components

**components/vendor-card.tsx:**

Vendor card component showing:
- Cover image (with placeholder if null)
- Business name
- Category badge
- Location with icon
- Star rating + review count
- Starting price
- Verified badge if applicable
- Pressable → navigates to vendor profile
- All text via `t()`, all colors from theme

```typescript
import { View, Text, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';

interface VendorCardProps {
  vendor: {
    id: string;
    businessName: string;
    category: string;
    location: string;
    rating: number;
    reviewCount: number;
    startingPrice: number | null;
    coverImage: string | null;
    isVerified: boolean;
  };
}

export function VendorCard({ vendor }: VendorCardProps) {
  const { t } = useTranslation();

  return (
    <Pressable
      className="mb-3 overflow-hidden rounded-card border border-border bg-surface"
      onPress={() => router.push(`/(main)/vendor/${vendor.id}`)}
    >
      {/* Cover image */}
      <View className="h-40 bg-surface-tertiary">
        {vendor.coverImage ? (
          <Image source={{ uri: vendor.coverImage }} className="h-full w-full" resizeMode="cover" />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <Ionicons name="business-outline" size={40} color="#868e96" />
          </View>
        )}
        {vendor.isVerified && (
          <View className="absolute top-2 right-2 rounded-full bg-brand-600 px-2 py-0.5">
            <Ionicons name="checkmark-circle" size={14} color="#fff" />
          </View>
        )}
      </View>
      {/* Info */}
      <View className="p-3">
        <Text className="text-base font-semibold text-content">{vendor.businessName}</Text>
        <Text className="mt-0.5 text-sm text-content-secondary">{vendor.category}</Text>
        <View className="mt-1 flex-row items-center">
          <Ionicons name="location-outline" size={14} color="#868e96" />
          <Text className="ml-1 text-sm text-content-tertiary">{vendor.location}</Text>
        </View>
        <View className="mt-2 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Ionicons name="star" size={14} color="#fab005" />
            <Text className="ml-1 text-sm font-medium text-content">{vendor.rating.toFixed(1)}</Text>
            <Text className="ml-1 text-sm text-content-tertiary">
              ({t('vendor.reviewCount', { count: vendor.reviewCount })})
            </Text>
          </View>
          {vendor.startingPrice && (
            <Text className="text-sm font-semibold text-brand-600">
              {t('vendor.startingFrom')} ${vendor.startingPrice}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}
```

**components/skeleton.tsx:**

Loading skeleton component with shimmer animation:

```typescript
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  className?: string;
}

export function Skeleton({ width, height = 20, borderRadius = 8, className }: SkeletonProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.7, { duration: 800 }), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      className={`bg-surface-tertiary ${className || ''}`}
      style={[{ width, height, borderRadius }, animatedStyle]}
    />
  );
}

export function VendorCardSkeleton() {
  return (
    <View className="mb-3 overflow-hidden rounded-card border border-border bg-surface">
      <Skeleton height={160} borderRadius={0} />
      <View className="p-3">
        <Skeleton width="70%" height={18} />
        <Skeleton width="40%" height={14} className="mt-2" />
        <Skeleton width="50%" height={14} className="mt-1" />
        <View className="mt-2 flex-row justify-between">
          <Skeleton width="30%" height={14} />
          <Skeleton width="25%" height={14} />
        </View>
      </View>
    </View>
  );
}
```

**components/empty-state.tsx:**

```typescript
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionTitle?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, subtitle, actionTitle, onAction }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <Ionicons name={icon} size={64} color="#868e96" />
      <Text className="mt-4 text-center text-lg font-semibold text-content">{title}</Text>
      {subtitle && (
        <Text className="mt-2 text-center text-sm text-content-secondary">{subtitle}</Text>
      )}
      {actionTitle && onAction && (
        <View className="mt-6">
          <Button title={actionTitle} onPress={onAction} />
        </View>
      )}
    </View>
  );
}
```

**components/filter-bottom-sheet.tsx:**

Bottom sheet for search filters using a Modal or custom animated view:
- Category selection (from API)
- Price range slider (min/max)
- Minimum rating selection (1-5 stars)
- Sort options (relevance, price low/high, highest rated)
- "Apply Filters" and "Clear Filters" buttons
- Animated slide-up with Reanimated
- All text via `t()`, all colors from theme

### 43.3 Home/Dashboard Screen

**app/(main)/index.tsx:**

Complete home screen with:
- SafeAreaView with padding
- Welcome message: `t('home.welcome', { name: user.name })`
- Search bar (Pressable that navigates to search tab)
- **Categories** horizontal scroll:
  - Grid of category icons (from `useCategories()` hook)
  - Each icon is a Pressable → navigates to search with category pre-selected
  - Show loading skeletons while fetching
- **Featured Vendors** horizontal carousel:
  - `FlatList` with `horizontal` and `showsHorizontalScrollIndicator={false}`
  - Uses `useFeaturedVendors()` hook
  - Each item is a compact `VendorCard`
  - "See All" button → navigate to search
- **Wedding Stats** (if user has a wedding):
  - Countdown card (days until wedding)
  - Quick stats row: vendors booked, tasks done, guests confirmed
  - Data from wedding API endpoint
- **Recently Viewed** (optional, from local storage or API)
- Pull-to-refresh on the ScrollView
- Loading skeletons for each section

```typescript
// Pattern:
import { ScrollView, RefreshControl, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { data: categories, isLoading: categoriesLoading, refetch: refetchCategories } = useCategories();
const { data: featured, isLoading: featuredLoading, refetch: refetchFeatured } = useFeaturedVendors();

const [refreshing, setRefreshing] = useState(false);
const onRefresh = async () => {
  setRefreshing(true);
  await Promise.all([refetchCategories(), refetchFeatured()]);
  setRefreshing(false);
};
```

### 43.4 Vendor Search Screen

**app/(main)/search.tsx:**

Full search screen with:
- Search input with debounce (300ms) using a custom `useDebounce` hook
- Filter chips row (active filters shown as removable chips)
- "Filters" button → opens filter bottom sheet
- Results list using `FlatList` with `useSearchVendors()` infinite query
- `onEndReached` → `fetchNextPage()` for infinite scroll
- Loading: show `VendorCardSkeleton` array
- Empty state: "No vendors found" with "Try adjusting your filters"
- Error state with retry button
- Pull-to-refresh

```typescript
// hooks/use-debounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
```

```typescript
// In search screen:
const [query, setQuery] = useState('');
const [filters, setFilters] = useState<SearchFilters>({});
const debouncedQuery = useDebounce(query, 300);

const {
  data,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  refetch,
} = useSearchVendors({ query: debouncedQuery, ...filters });

const vendors = data?.pages.flatMap((page) => page.data) ?? [];

<FlatList
  data={vendors}
  renderItem={({ item }) => <VendorCard vendor={item} />}
  keyExtractor={(item) => item.id}
  onEndReached={() => hasNextPage && fetchNextPage()}
  onEndReachedThreshold={0.5}
  ListEmptyComponent={!isLoading ? <EmptyState ... /> : null}
  ListFooterComponent={isFetchingNextPage ? <ActivityIndicator /> : null}
  refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
/>
```

### 43.5 Vendor Profile Screen

**app/(main)/vendor/[id].tsx:**

Stack-pushed screen from search results:
- **Hero section:** cover image or image carousel (horizontal FlatList with pagination dots)
- **Header:** business name, category badge, location, verified badge
- **Stats row:** rating (stars), review count, starting price
- **Action buttons row:** "Request Quote" (primary), "Save" (outline), "Share" (outline)
- **Tab sections** (segmented control or scrollable top tabs):
  - **About:** description text, contact info, operating hours
  - **Portfolio:** image grid (2 columns), tap to view fullscreen (Modal with Image)
  - **Packages:** pricing cards with name, description, price, included items
  - **Reviews:** star breakdown bar chart, review list (avatar, name, rating, date, text)
  - **FAQ:** accordion/collapsible sections
- **Floating "Request Quote" button** at bottom
- **Inquiry bottom sheet** (triggered by "Request Quote"):
  - Wedding date picker
  - Guest count input
  - Message textarea
  - Budget range selector
  - Submit button → `useSendInquiry()` mutation
  - Success feedback with haptics

Data fetched using: `useVendor(id)`, `useVendorPortfolio(id)`, `useVendorPackages(id)`, `useVendorReviews(id)`

All with loading skeletons, error states, and empty states per section.

### 43.6 Categories View

If categories are shown on home as a grid, also support a "See All Categories" screen or section:

- Grid layout (2 or 3 columns)
- Each category: icon, name, vendor count
- Tap → navigate to search with `category` filter pre-set
- Data from `useCategories()` hook

Category icons: map category names to Ionicons (e.g., "Photography" → "camera-outline", "Catering" → "restaurant-outline", "Music" → "musical-notes-outline"). Create a `lib/category-icons.ts` mapping.

```typescript
// lib/category-icons.ts
import { type ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

type IconName = ComponentProps<typeof Ionicons>['name'];

export const categoryIcons: Record<string, IconName> = {
  photography: 'camera-outline',
  catering: 'restaurant-outline',
  music: 'musical-notes-outline',
  venue: 'business-outline',
  decoration: 'flower-outline',
  cake: 'cafe-outline',
  makeup: 'color-palette-outline',
  transportation: 'car-outline',
  invitation: 'mail-outline',
  planning: 'clipboard-outline',
};

export function getCategoryIcon(category: string): IconName {
  return categoryIcons[category.toLowerCase()] || 'grid-outline';
}
```

## Acceptance Criteria
- [ ] Home screen shows welcome message with user name (localized)
- [ ] Categories load from real API and display as horizontal scroll
- [ ] Featured vendors load from real API and display as horizontal carousel
- [ ] Tapping category navigates to search with category pre-filtered
- [ ] Search input debounces (300ms) and queries Meilisearch via API
- [ ] Filter bottom sheet opens with category, price, rating, sort options
- [ ] Active filters shown as removable chips
- [ ] Infinite scroll loads more vendors on scroll to bottom
- [ ] Loading state shows skeleton cards
- [ ] Empty state shows "No vendors found" message
- [ ] Vendor card shows image, name, category, location, rating, price
- [ ] Tapping vendor card opens vendor profile screen
- [ ] Vendor profile shows hero image, info, tabs (About, Portfolio, Packages, Reviews, FAQ)
- [ ] Portfolio shows image grid, tap for fullscreen view
- [ ] Packages show pricing cards
- [ ] Reviews show star breakdown and review list
- [ ] "Request Quote" opens inquiry bottom sheet
- [ ] Inquiry form submits to real API endpoint
- [ ] Success feedback with haptic notification
- [ ] Pull-to-refresh works on home and search screens
- [ ] All text via `t()` — no hardcoded strings
- [ ] All colors from NativeWind theme — no hardcoded colors
- [ ] TypeScript compiles with 0 errors

## Files to Create/Modify
- `apps/mobile/hooks/api/use-search.ts` (create)
- `apps/mobile/hooks/api/use-vendors.ts` (create)
- `apps/mobile/hooks/api/use-categories.ts` (create)
- `apps/mobile/hooks/use-debounce.ts` (create)
- `apps/mobile/lib/category-icons.ts` (create)
- `apps/mobile/components/vendor-card.tsx` (create)
- `apps/mobile/components/skeleton.tsx` (create)
- `apps/mobile/components/empty-state.tsx` (create)
- `apps/mobile/components/filter-bottom-sheet.tsx` (create)
- `apps/mobile/components/inquiry-bottom-sheet.tsx` (create)
- `apps/mobile/app/(main)/index.tsx` (rewrite)
- `apps/mobile/app/(main)/search.tsx` (rewrite)
- `apps/mobile/app/(main)/vendor/[id].tsx` (create)
- `apps/mobile/i18n/en.json` (update if needed)
- `apps/mobile/i18n/am.json` (update if needed)

## Dependencies
- Task 41: Mobile App Scaffolding
- Task 42: Mobile Auth
