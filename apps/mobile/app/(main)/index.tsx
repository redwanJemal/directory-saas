import { View, Text, ScrollView, Pressable, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState, useCallback, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useLocationStore } from '@/store/location-store';
import { useCategories, type Category } from '@/hooks/api/use-categories';
import { useFeaturedVendors } from '@/hooks/api/use-vendors';
import { getCategoryIcon } from '@/lib/category-icons';
import { VendorCard } from '@/components/vendor-card';
import { CountryCitySelector } from '@/components/country-city-selector';
import { Skeleton, CategorySkeleton, CompactVendorCardSkeleton } from '@/components/skeleton';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { country, countryName, city, cityName, initialize: initLocation } = useLocationStore();
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const {
    data: categories,
    isLoading: categoriesLoading,
    refetch: refetchCategories,
  } = useCategories();
  const {
    data: featured,
    isLoading: featuredLoading,
    refetch: refetchFeatured,
  } = useFeaturedVendors(country, city);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    initLocation();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchCategories(), refetchFeatured()]);
    setRefreshing(false);
  }, [refetchCategories, refetchFeatured]);

  const featuredVendors = Array.isArray(featured) ? featured : [];

  const locationLabel = cityName
    ? `${cityName}, ${countryName}`
    : countryName
      ? countryName
      : t('location.allCountries');

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView
        contentContainerClassName="pb-8"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4c6ef5" />
        }
      >
        {/* Header with Location */}
        <View className="px-4 pt-4">
          <Text className="text-2xl font-bold text-content">
            {t('home.welcome', { name: user?.name || '' })}
          </Text>
          <Pressable
            className="mt-2 flex-row items-center"
            onPress={() => setShowLocationPicker(true)}
          >
            <Ionicons name="location" size={16} color="#4c6ef5" />
            <Text className="ml-1 text-sm font-medium text-brand-600">{locationLabel}</Text>
            <Ionicons name="chevron-down" size={14} color="#4c6ef5" className="ml-1" />
          </Pressable>
        </View>

        {/* Search Bar */}
        <Pressable
          className="mx-4 mt-4 flex-row items-center rounded-input border border-border bg-surface-secondary px-4 py-3"
          onPress={() => router.navigate('/(main)/search')}
        >
          <Ionicons name="search-outline" size={18} color="#868e96" />
          <Text className="ml-2 text-content-tertiary">{t('home.searchPlaceholder')}</Text>
        </Pressable>

        {/* Category Grid */}
        <View className="mt-6">
          <View className="flex-row items-center justify-between px-4">
            <Text className="text-lg font-semibold text-content">{t('home.categories')}</Text>
            <Pressable onPress={() => router.navigate('/(main)/search')}>
              <Text className="text-sm font-medium text-brand-600">{t('common.seeAll')}</Text>
            </Pressable>
          </View>
          {categoriesLoading ? (
            <View className="mt-3 flex-row flex-wrap px-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <View key={i} className="mb-3 w-1/4 items-center">
                  <CategorySkeleton />
                </View>
              ))}
            </View>
          ) : (
            <View className="mt-3 flex-row flex-wrap px-4">
              {(categories as Category[] | undefined)?.slice(0, 8).map((cat) => (
                <Pressable
                  key={cat.id}
                  className="mb-4 w-1/4 items-center"
                  onPress={() =>
                    router.navigate({
                      pathname: '/(main)/search',
                      params: { category: cat.slug },
                    })
                  }
                >
                  <View className="h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
                    <Ionicons name={getCategoryIcon(cat.slug)} size={24} color="#4c6ef5" />
                  </View>
                  <Text
                    className="mt-1.5 text-center text-xs font-medium text-content-secondary"
                    numberOfLines={2}
                  >
                    {cat.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Featured Businesses */}
        <View className="mt-2">
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
                {t('home.noFeatured')}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Country/City Selector Modal */}
      <CountryCitySelector
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
      />
    </SafeAreaView>
  );
}
