import { View, Text, ScrollView, Pressable, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState, useCallback } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useCategories, type Category } from '@/hooks/api/use-categories';
import { useFeaturedVendors } from '@/hooks/api/use-vendors';
import { getCategoryIcon } from '@/lib/category-icons';
import { VendorCard } from '@/components/vendor-card';
import {
  CategorySkeleton,
  CompactVendorCardSkeleton,
} from '@/components/skeleton';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const {
    data: categories,
    isLoading: categoriesLoading,
    refetch: refetchCategories,
  } = useCategories();
  const {
    data: featured,
    isLoading: featuredLoading,
    refetch: refetchFeatured,
  } = useFeaturedVendors();

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchCategories(), refetchFeatured()]);
    setRefreshing(false);
  }, [refetchCategories, refetchFeatured]);

  const featuredVendors = Array.isArray(featured) ? featured : [];

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView
        contentContainerClassName="pb-8"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4c6ef5" />
        }
      >
        {/* Header */}
        <View className="px-4 pt-4">
          <Text className="text-2xl font-bold text-content">
            {t('home.welcome', { name: user?.name || '' })}
          </Text>
        </View>

        {/* Search Bar */}
        <Pressable
          className="mx-4 mt-4 flex-row items-center rounded-input border border-border bg-surface-secondary px-4 py-3"
          onPress={() => router.navigate('/(main)/search')}
        >
          <Ionicons name="search-outline" size={18} color="#868e96" />
          <Text className="ml-2 text-content-tertiary">{t('home.searchPlaceholder')}</Text>
        </Pressable>

        {/* Quick Stats */}
        <View className="mt-5 flex-row px-4">
          <View className="mr-2 flex-1 rounded-card bg-surface-secondary p-4">
            <Ionicons name="storefront-outline" size={24} color="#4c6ef5" />
            <Text className="mt-2 text-2xl font-bold text-content">0</Text>
            <Text className="text-sm text-content-secondary">{t('home.vendorsBooked')}</Text>
          </View>
          <View className="ml-2 flex-1 rounded-card bg-surface-secondary p-4">
            <Ionicons name="checkmark-circle-outline" size={24} color="#40c057" />
            <Text className="mt-2 text-2xl font-bold text-content">0</Text>
            <Text className="text-sm text-content-secondary">{t('home.tasksCompleted')}</Text>
          </View>
        </View>

        {/* Categories */}
        <View className="mt-6">
          <View className="flex-row items-center justify-between px-4">
            <Text className="text-lg font-semibold text-content">{t('home.categories')}</Text>
            <Pressable
              onPress={() => router.navigate('/(main)/search')}
            >
              <Text className="text-sm font-medium text-brand-600">{t('common.seeAll')}</Text>
            </Pressable>
          </View>
          {categoriesLoading ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="px-4 mt-3"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <CategorySkeleton key={i} />
              ))}
            </ScrollView>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="px-4 mt-3"
            >
              {(categories as Category[] | undefined)?.map((cat) => (
                <Pressable
                  key={cat.id}
                  className="mr-4 items-center"
                  onPress={() =>
                    router.navigate({
                      pathname: '/(main)/search',
                      params: { category: cat.slug },
                    })
                  }
                >
                  <View className="h-14 w-14 items-center justify-center rounded-full bg-brand-50">
                    <Ionicons name={getCategoryIcon(cat.slug)} size={24} color="#4c6ef5" />
                  </View>
                  <Text className="mt-1.5 text-xs font-medium text-content-secondary">
                    {cat.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Featured Vendors */}
        <View className="mt-6">
          <View className="flex-row items-center justify-between px-4">
            <Text className="text-lg font-semibold text-content">
              {t('home.featuredVendors')}
            </Text>
            <Pressable onPress={() => router.navigate('/(main)/search')}>
              <Text className="text-sm font-medium text-brand-600">{t('common.seeAll')}</Text>
            </Pressable>
          </View>
          {featuredLoading ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="px-4 mt-3"
            >
              {Array.from({ length: 3 }).map((_, i) => (
                <CompactVendorCardSkeleton key={i} />
              ))}
            </ScrollView>
          ) : featuredVendors.length > 0 ? (
            <FlatList
              data={featuredVendors}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="px-4 mt-3"
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <VendorCard vendor={item} compact />}
            />
          ) : (
            <View className="mx-4 mt-3 items-center rounded-card bg-surface-secondary py-8">
              <Ionicons name="storefront-outline" size={32} color="#ced4da" />
              <Text className="mt-2 text-content-secondary">
                {t('home.searchPlaceholder')}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
