import { View, Text, ScrollView, Image, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState, useCallback } from 'react';
import { useBooking, useAcceptQuote, useDeclineQuote } from '@/hooks/api/use-bookings';
import { StatusTimeline } from '@/components/status-timeline';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/skeleton';
import { Pressable } from 'react-native';

export default function BookingDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: booking, isLoading, refetch } = useBooking(id || '');
  const acceptQuote = useAcceptQuote();
  const declineQuote = useDeclineQuote();

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleAccept = useCallback(() => {
    Alert.alert(
      t('bookings.confirmAcceptTitle'),
      t('bookings.confirmAcceptMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('bookings.acceptQuote'),
          onPress: async () => {
            try {
              await acceptQuote.mutateAsync(id || '');
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              refetch();
            } catch {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
          },
        },
      ],
    );
  }, [id, acceptQuote, refetch, t]);

  const handleDecline = useCallback(() => {
    Alert.alert(
      t('bookings.confirmDeclineTitle'),
      t('bookings.confirmDeclineMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('bookings.declineQuote'),
          style: 'destructive',
          onPress: async () => {
            try {
              await declineQuote.mutateAsync(id || '');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              refetch();
            } catch {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
          },
        },
      ],
    );
  }, [id, declineQuote, refetch, t]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <View className="flex-row items-center px-4 pt-4">
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#212529" />
          </Pressable>
          <Text className="ml-3 text-lg font-semibold text-content">
            {t('bookings.viewDetails')}
          </Text>
        </View>
        <View className="px-4 pt-6">
          <View className="flex-row items-center">
            <Skeleton width={60} height={60} borderRadius={12} />
            <View className="ml-3">
              <Skeleton width={150} height={18} />
              <Skeleton width={80} height={14} className="mt-2" />
            </View>
          </View>
          <View className="mt-6">
            <Skeleton width="100%" height={160} borderRadius={12} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <View className="flex-row items-center px-4 pt-4">
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#212529" />
          </Pressable>
        </View>
        <View className="flex-1 items-center justify-center">
          <Ionicons name="alert-circle-outline" size={48} color="#868e96" />
          <Text className="mt-3 text-content-secondary">{t('errors.notFound')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const formattedDate = booking.eventDate
    ? new Date(booking.eventDate).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="flex-row items-center border-b border-border px-4 pb-3 pt-4">
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#212529" />
        </Pressable>
        <Text className="ml-3 flex-1 text-lg font-semibold text-content">
          {t('bookings.viewDetails')}
        </Text>
        <StatusBadge status={booking.status} />
      </View>

      <ScrollView
        contentContainerClassName="pb-8"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4c6ef5" />
        }
      >
        {/* Vendor Info */}
        <View className="flex-row items-center border-b border-border px-4 py-4">
          <View className="h-14 w-14 overflow-hidden rounded-lg bg-surface-tertiary">
            {booking.vendor.coverImage ? (
              <Image
                source={{ uri: booking.vendor.coverImage }}
                className="h-full w-full"
                resizeMode="cover"
              />
            ) : (
              <View className="h-full w-full items-center justify-center">
                <Ionicons name="business-outline" size={24} color="#868e96" />
              </View>
            )}
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-base font-semibold text-content">
              {booking.vendor.businessName}
            </Text>
            <Text className="mt-0.5 text-sm text-content-secondary">
              {booking.vendor.category}
            </Text>
          </View>
        </View>

        {/* Status Timeline */}
        <View className="border-b border-border py-2">
          <Text className="px-4 pb-2 text-sm font-semibold text-content-secondary">
            {t('bookings.statusProgress')}
          </Text>
          <StatusTimeline
            currentStatus={booking.status}
            createdAt={booking.createdAt}
            updatedAt={booking.updatedAt}
          />
        </View>

        {/* Details Section */}
        <View className="border-b border-border px-4 py-4">
          <Text className="mb-3 text-sm font-semibold text-content-secondary">
            {t('bookings.details')}
          </Text>

          {formattedDate && (
            <View className="mb-2 flex-row items-center">
              <Ionicons name="calendar-outline" size={16} color="#868e96" />
              <Text className="ml-2 text-sm text-content">{formattedDate}</Text>
            </View>
          )}

          {booking.guestCount != null && (
            <View className="mb-2 flex-row items-center">
              <Ionicons name="people-outline" size={16} color="#868e96" />
              <Text className="ml-2 text-sm text-content">
                {booking.guestCount} {t('vendor.guestCount').toLowerCase()}
              </Text>
            </View>
          )}

          {booking.quotedPrice != null && (
            <View className="mb-2 flex-row items-center">
              <Ionicons name="pricetag-outline" size={16} color="#868e96" />
              <Text className="ml-2 text-sm font-semibold text-brand-600">
                ${booking.quotedPrice.toLocaleString()}
              </Text>
            </View>
          )}

          {booking.message && (
            <View className="mt-2 rounded-lg bg-surface-secondary p-3">
              <Text className="text-xs font-medium text-content-secondary">
                {t('vendor.message')}
              </Text>
              <Text className="mt-1 text-sm text-content">{booking.message}</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View className="px-4 pt-4">
          {booking.status === 'QUOTED' && (
            <View>
              <Button
                title={t('bookings.acceptQuote')}
                onPress={handleAccept}
                loading={acceptQuote.isPending}
                haptic="medium"
              />
              <View className="mt-3">
                <Button
                  title={t('bookings.declineQuote')}
                  variant="outline"
                  onPress={handleDecline}
                  loading={declineQuote.isPending}
                  haptic="heavy"
                />
              </View>
            </View>
          )}

          {(booking.status === 'BOOKED' || booking.status === 'INQUIRY') && (
            <Button
              title={t('bookings.messageVendor')}
              variant="secondary"
              onPress={() => {
                // Navigate to messages when available
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
