import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useState, useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useSearchVendors, type Vendor } from '@/hooks/api/use-search';
import { useDebounce } from '@/hooks/use-debounce';
import { VendorCard } from '@/components/vendor-card';
import { VendorCardSkeleton } from '@/components/skeleton';
import { EmptyState } from '@/components/empty-state';
import {
  FilterBottomSheet,
  type SearchFilters,
} from '@/components/filter-bottom-sheet';

export default function SearchScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ category?: string }>();

  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>(() => ({
    category: params.category || undefined,
  }));
  const [showFilters, setShowFilters] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useSearchVendors({ query: debouncedQuery, ...filters });

  const vendors = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.category) count++;
    if (filters.priceMin != null || filters.priceMax != null) count++;
    if (filters.ratingMin) count++;
    if (filters.sort) count++;
    return count;
  }, [filters]);

  const removeFilter = (key: keyof SearchFilters) => {
    setFilters((prev) => {
      const next = { ...prev };
      delete next[key];
      if (key === 'priceMin' || key === 'priceMax') {
        delete next.priceMin;
        delete next.priceMax;
      }
      return next;
    });
  };

  const renderHeader = () => (
    <View>
      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <View className="flex-row flex-wrap px-4 pb-2">
          {filters.category && (
            <Pressable
              className="mb-1 mr-2 flex-row items-center rounded-full bg-brand-50 px-3 py-1"
              onPress={() => removeFilter('category')}
            >
              <Text className="text-xs font-medium text-brand-700">{filters.category}</Text>
              <Ionicons name="close-circle" size={14} color="#4263eb" className="ml-1" />
            </Pressable>
          )}
          {(filters.priceMin != null || filters.priceMax != null) && (
            <Pressable
              className="mb-1 mr-2 flex-row items-center rounded-full bg-brand-50 px-3 py-1"
              onPress={() => removeFilter('priceMin')}
            >
              <Text className="text-xs font-medium text-brand-700">
                ${filters.priceMin || 0} - ${filters.priceMax || '∞'}
              </Text>
              <Ionicons name="close-circle" size={14} color="#4263eb" className="ml-1" />
            </Pressable>
          )}
          {filters.ratingMin && (
            <Pressable
              className="mb-1 mr-2 flex-row items-center rounded-full bg-brand-50 px-3 py-1"
              onPress={() => removeFilter('ratingMin')}
            >
              <Ionicons name="star" size={10} color="#fab005" />
              <Text className="ml-0.5 text-xs font-medium text-brand-700">
                {filters.ratingMin}+
              </Text>
              <Ionicons name="close-circle" size={14} color="#4263eb" className="ml-1" />
            </Pressable>
          )}
          {filters.sort && (
            <Pressable
              className="mb-1 mr-2 flex-row items-center rounded-full bg-brand-50 px-3 py-1"
              onPress={() => removeFilter('sort')}
            >
              <Text className="text-xs font-medium text-brand-700">{filters.sort}</Text>
              <Ionicons name="close-circle" size={14} color="#4263eb" className="ml-1" />
            </Pressable>
          )}
        </View>
      )}
    </View>
  );

  const renderFooter = () => {
    if (isFetchingNextPage) {
      return (
        <View className="py-4">
          <ActivityIndicator color="#4c6ef5" />
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Search header */}
      <View className="px-4 pt-4 pb-2">
        <Text className="mb-3 text-2xl font-bold text-content">{t('search.title')}</Text>
        <View className="flex-row items-center">
          <View className="mr-2 flex-1 flex-row items-center rounded-input border border-border bg-surface-secondary px-3">
            <Ionicons name="search-outline" size={18} color="#868e96" />
            <TextInput
              className="ml-2 flex-1 py-2.5 text-content"
              placeholder={t('search.placeholder')}
              placeholderTextColor="#868e96"
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={18} color="#868e96" />
              </Pressable>
            )}
          </View>
          <Pressable
            className="relative items-center justify-center rounded-input border border-border bg-surface-secondary p-2.5"
            onPress={() => setShowFilters(true)}
          >
            <Ionicons name="options-outline" size={22} color="#495057" />
            {activeFilterCount > 0 && (
              <View className="absolute -top-1 -right-1 h-4 w-4 items-center justify-center rounded-full bg-brand-600">
                <Text className="text-[10px] font-bold text-content-inverse">
                  {activeFilterCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* Results */}
      {isLoading ? (
        <View className="px-4 pt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <VendorCardSkeleton key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={vendors}
          renderItem={({ item }: { item: Vendor }) => <VendorCard vendor={item} />}
          keyExtractor={(item: Vendor) => item.id}
          contentContainerClassName="px-4 pt-2 pb-4"
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title={t('search.noVendorsFound')}
              subtitle={t('search.tryDifferentFilters')}
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => refetch()}
              tintColor="#4c6ef5"
            />
          }
        />
      )}

      {/* Filter Bottom Sheet */}
      <FilterBottomSheet
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApply={setFilters}
      />
    </SafeAreaView>
  );
}
