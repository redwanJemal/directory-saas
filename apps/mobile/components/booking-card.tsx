import { View, Text, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StatusBadge } from '@/components/status-badge';
import type { Booking } from '@/hooks/api/use-bookings';

interface BookingCardProps {
  booking: Booking;
  onPress: () => void;
}

export function BookingCard({ booking, onPress }: BookingCardProps) {
  const { t } = useTranslation();
  const createdDate = new Date(booking.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Pressable
      className="mb-3 flex-row overflow-hidden rounded-card border border-border bg-surface p-3 active:opacity-80"
      onPress={onPress}
    >
      {/* Vendor Thumbnail */}
      <View className="h-16 w-16 overflow-hidden rounded-lg bg-surface-tertiary">
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

      {/* Booking Info */}
      <View className="ml-3 flex-1 justify-center">
        <View className="flex-row items-center justify-between">
          <Text className="flex-1 text-sm font-semibold text-content" numberOfLines={1}>
            {booking.vendor.businessName}
          </Text>
          <StatusBadge status={booking.status} />
        </View>
        <Text className="mt-0.5 text-xs text-content-secondary">
          {booking.vendor.category}
        </Text>
        <View className="mt-1 flex-row items-center justify-between">
          <Text className="text-xs text-content-tertiary">{createdDate}</Text>
          {booking.quotedPrice != null && (
            <Text className="text-xs font-semibold text-brand-600">
              ${booking.quotedPrice.toLocaleString()}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}
