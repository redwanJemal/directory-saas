import { View, Text, ScrollView, Pressable, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState, useCallback } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useCategories, type Category } from '@/hooks/api/use-categories';
import { useFeaturedVendors } from '@/hooks/api/use-vendors';
import { useWedding, useWeddingStats } from '@/hooks/api/use-wedding';
import { useBookings } from '@/hooks/api/use-bookings';
import { getCategoryIcon } from '@/lib/category-icons';
import { VendorCard } from '@/components/vendor-card';
import { CountdownCard } from '@/components/countdown-card';
import { StatCard } from '@/components/stat-card';
import { WeddingSetup } from '@/components/wedding-setup';
import { Skeleton, CategorySkeleton, CompactVendorCardSkeleton } from '@/components/skeleton';

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
  const {
    data: wedding,
    isLoading: weddingLoading,
    isError: weddingError,
    refetch: refetchWedding,
  } = useWedding();
  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useWeddingStats();
  const {
    data: bookedVendors,
    refetch: refetchBookedVendors,
  } = useBookings('BOOKED');

  const [refreshing, setRefreshing] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchCategories(),
      refetchFeatured(),
      refetchWedding(),
      refetchStats(),
      refetchBookedVendors(),
    ]);
    setRefreshing(false);
  }, [refetchCategories, refetchFeatured, refetchWedding, refetchStats, refetchBookedVendors]);

  const featuredVendors = Array.isArray(featured) ? featured : [];
  const hasWedding = !!wedding && !weddingError;
  const bookedVendorsList = Array.isArray(bookedVendors) ? bookedVendors : [];

  // Show wedding setup flow
  if (showSetup) {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <WeddingSetup
          onComplete={() => {
            setShowSetup(false);
            refetchWedding();
            refetchStats();
          }}
        />
      </SafeAreaView>
    );
  }

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

        {/* Wedding Section */}
        {weddingLoading ? (
          <View className="mx-4 mt-4">
            <Skeleton width="100%" height={140} borderRadius={12} />
          </View>
        ) : hasWedding ? (
          <>
            {/* Countdown Card */}
            <View className="mt-4">
              <CountdownCard
                daysUntilWedding={stats?.daysUntilWedding ?? 0}
                weddingDate={wedding.weddingDate}
                partnerName={wedding.partnerName}
                userName={user?.name || ''}
              />
            </View>

            {/* Quick Stats */}
            <View className="mt-4 px-4">
              <View className="flex-row gap-2">
                <StatCard
                  icon="storefront-outline"
                  iconColor="#4c6ef5"
                  label={t('home.vendorsBooked')}
                  value={statsLoading ? '...' : (stats?.vendorsBooked ?? 0)}
                />
                <StatCard
                  icon="people-outline"
                  iconColor="#40c057"
                  label={t('home.guestsConfirmed')}
                  value={statsLoading ? '...' : (stats?.guestsConfirmed ?? 0)}
                />
              </View>
              <View className="mt-2 flex-row gap-2">
                <StatCard
                  icon="wallet-outline"
                  iconColor="#fab005"
                  label={t('wedding.budgetSpent', { percent: stats?.budgetSpentPercent ?? 0 })}
                  value={`${stats?.budgetSpentPercent ?? 0}%`}
                />
                <StatCard
                  icon="checkmark-circle-outline"
                  iconColor="#4c6ef5"
                  label={t('home.tasksCompleted')}
                  value={`${stats?.completedTasks ?? 0}/${stats?.totalTasks ?? 0}`}
                />
              </View>
            </View>

            {/* Quick Actions */}
            <View className="mt-5 px-4">
              <Text className="mb-3 text-lg font-semibold text-content">
                {t('dashboard.quickActions')}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Pressable
                  className="mr-3 items-center rounded-card bg-surface-secondary px-4 py-3"
                  onPress={() => router.navigate('/(main)/planner')}
                >
                  <Ionicons name="person-add-outline" size={22} color="#4c6ef5" />
                  <Text className="mt-1 text-xs font-medium text-content-secondary">
                    {t('dashboard.addGuest')}
                  </Text>
                </Pressable>
                <Pressable
                  className="mr-3 items-center rounded-card bg-surface-secondary px-4 py-3"
                  onPress={() => router.navigate('/(main)/planner')}
                >
                  <Ionicons name="wallet-outline" size={22} color="#fab005" />
                  <Text className="mt-1 text-xs font-medium text-content-secondary">
                    {t('dashboard.checkBudget')}
                  </Text>
                </Pressable>
                <Pressable
                  className="mr-3 items-center rounded-card bg-surface-secondary px-4 py-3"
                  onPress={() => router.navigate('/(main)/search')}
                >
                  <Ionicons name="search-outline" size={22} color="#7950f2" />
                  <Text className="mt-1 text-xs font-medium text-content-secondary">
                    {t('dashboard.findVendors')}
                  </Text>
                </Pressable>
                <Pressable
                  className="mr-3 items-center rounded-card bg-surface-secondary px-4 py-3"
                  onPress={() => router.navigate('/(main)/planner')}
                >
                  <Ionicons name="checkbox-outline" size={22} color="#40c057" />
                  <Text className="mt-1 text-xs font-medium text-content-secondary">
                    {t('dashboard.viewChecklist')}
                  </Text>
                </Pressable>
              </ScrollView>
            </View>

            {/* My Vendors (booked) */}
            {bookedVendorsList.length > 0 && (
              <View className="mt-5">
                <View className="flex-row items-center justify-between px-4">
                  <Text className="text-lg font-semibold text-content">
                    {t('dashboard.myVendors')}
                  </Text>
                  <Pressable onPress={() => router.navigate('/(main)/bookings')}>
                    <Text className="text-sm font-medium text-brand-600">{t('common.seeAll')}</Text>
                  </Pressable>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="px-4 mt-3"
                >
                  {bookedVendorsList.map((booking) => (
                    <Pressable
                      key={booking.id}
                      className="mr-3 w-32 items-center rounded-card bg-surface-secondary p-3"
                      onPress={() =>
                        router.push({
                          pathname: '/booking/[id]',
                          params: { id: booking.id },
                        })
                      }
                    >
                      <View className="h-12 w-12 items-center justify-center rounded-full bg-brand-50">
                        <Ionicons name="business-outline" size={20} color="#4c6ef5" />
                      </View>
                      <Text
                        className="mt-2 text-center text-xs font-semibold text-content"
                        numberOfLines={2}
                      >
                        {booking.vendor.businessName}
                      </Text>
                      <Text className="mt-0.5 text-center text-xs text-content-tertiary" numberOfLines={1}>
                        {booking.vendor.category}
                      </Text>
                    </Pressable>
                  ))}
                  <Pressable
                    className="mr-3 w-32 items-center justify-center rounded-card border border-dashed border-border bg-surface p-3"
                    onPress={() => router.navigate('/(main)/search')}
                  >
                    <Ionicons name="add-circle-outline" size={24} color="#868e96" />
                    <Text className="mt-1 text-center text-xs font-medium text-content-secondary">
                      {t('dashboard.findMore')}
                    </Text>
                  </Pressable>
                </ScrollView>
              </View>
            )}
          </>
        ) : (
          /* No Wedding — Setup Prompt */
          <Pressable
            className="mx-4 mt-4 items-center rounded-card bg-brand-50 px-6 py-8"
            onPress={() => setShowSetup(true)}
          >
            <Ionicons name="heart-outline" size={48} color="#4c6ef5" />
            <Text className="mt-3 text-lg font-semibold text-content">
              {t('wedding.setup')}
            </Text>
            <Text className="mt-1 text-center text-sm text-content-secondary">
              {t('weddingSetup.setupSubtitle')}
            </Text>
            <View className="mt-4 rounded-button bg-brand-600 px-6 py-2.5">
              <Text className="text-sm font-semibold text-content-inverse">
                {t('common.getStarted')}
              </Text>
            </View>
          </Pressable>
        )}

        {/* Search Bar */}
        <Pressable
          className="mx-4 mt-5 flex-row items-center rounded-input border border-border bg-surface-secondary px-4 py-3"
          onPress={() => router.navigate('/(main)/search')}
        >
          <Ionicons name="search-outline" size={18} color="#868e96" />
          <Text className="ml-2 text-content-tertiary">{t('home.searchPlaceholder')}</Text>
        </Pressable>

        {/* Categories */}
        <View className="mt-6">
          <View className="flex-row items-center justify-between px-4">
            <Text className="text-lg font-semibold text-content">{t('home.categories')}</Text>
            <Pressable onPress={() => router.navigate('/(main)/search')}>
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
