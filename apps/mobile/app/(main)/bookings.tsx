import { useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useBookings, type BookingStatus } from '@/hooks/api/use-bookings';
import { BookingCard } from '@/components/booking-card';
import { EmptyState } from '@/components/empty-state';
import { Skeleton } from '@/components/skeleton';

type FilterTab = 'ALL' | BookingStatus;

const FILTER_TABS: { key: FilterTab; labelKey: string }[] = [
  { key: 'ALL', labelKey: 'bookings.filterAll' },
  { key: 'INQUIRY', labelKey: 'bookings.status.inquiry' },
  { key: 'QUOTED', labelKey: 'bookings.status.quoted' },
  { key: 'BOOKED', labelKey: 'bookings.status.booked' },
  { key: 'COMPLETED', labelKey: 'bookings.status.completed' },
];

export default function BookingsScreen() {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL');
  const statusParam = activeFilter === 'ALL' ? undefined : activeFilter;

  const {
    data: bookings,
    isLoading,
    refetch,
  } = useBookings(statusParam);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const bookingsList = Array.isArray(bookings) ? bookings : [];

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="px-4 pt-4">
        <Text className="text-2xl font-bold text-content">
          {t('bookings.title')}
        </Text>
      </View>

      {/* Filter Tabs */}
      <View className="mt-3">
        <FlatList
          data={FILTER_TABS}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-4"
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <Pressable
              className={`mr-2 rounded-full px-4 py-2 ${
                activeFilter === item.key
                  ? 'bg-brand-600'
                  : 'bg-surface-secondary border border-border'
              }`}
              onPress={() => setActiveFilter(item.key)}
            >
              <Text
                className={`text-sm font-medium ${
                  activeFilter === item.key ? 'text-content-inverse' : 'text-content'
                }`}
              >
                {t(item.labelKey)}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {/* Booking List */}
      {isLoading ? (
        <View className="px-4 pt-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <View key={i} className="mb-3 flex-row rounded-card border border-border bg-surface p-3">
              <Skeleton width={64} height={64} borderRadius={8} />
              <View className="ml-3 flex-1">
                <Skeleton width="70%" height={16} />
                <Skeleton width="40%" height={12} className="mt-2" />
                <Skeleton width="50%" height={12} className="mt-1" />
              </View>
            </View>
          ))}
        </View>
      ) : bookingsList.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title={t('bookings.noBookings')}
          subtitle={t('bookings.noBookingsSubtitle')}
          actionTitle={t('bookings.findVendors')}
          onAction={() => router.navigate('/(main)/search')}
        />
      ) : (
        <FlatList
          data={bookingsList}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-4 pt-4 pb-8"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4c6ef5" />
          }
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              onPress={() =>
                router.push({
                  pathname: '/booking/[id]',
                  params: { id: item.id },
                })
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
