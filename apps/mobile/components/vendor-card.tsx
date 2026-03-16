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
  compact?: boolean;
}

export function VendorCard({ vendor, compact }: VendorCardProps) {
  const { t } = useTranslation();

  if (compact) {
    return (
      <Pressable
        className="mr-3 w-56 overflow-hidden rounded-card border border-border bg-surface"
        onPress={() => router.push(`/vendor/${vendor.id}`)}
      >
        <View className="h-28 bg-surface-tertiary">
          {vendor.coverImage ? (
            <Image source={{ uri: vendor.coverImage }} className="h-full w-full" resizeMode="cover" />
          ) : (
            <View className="h-full w-full items-center justify-center">
              <Ionicons name="business-outline" size={28} color="#868e96" />
            </View>
          )}
          {vendor.isVerified && (
            <View className="absolute top-2 right-2 flex-row items-center rounded-full bg-brand-600 px-1.5 py-0.5">
              <Ionicons name="checkmark-circle" size={12} color="#fff" />
            </View>
          )}
        </View>
        <View className="p-2.5">
          <Text className="text-sm font-semibold text-content" numberOfLines={1}>
            {vendor.businessName}
          </Text>
          <View className="mt-1 flex-row items-center">
            <Ionicons name="star" size={12} color="#fab005" />
            <Text className="ml-1 text-xs font-medium text-content">
              {vendor.rating.toFixed(1)}
            </Text>
            <Text className="ml-1 text-xs text-content-tertiary">
              ({vendor.reviewCount})
            </Text>
          </View>
          {vendor.startingPrice != null && (
            <Text className="mt-1 text-xs font-semibold text-brand-600">
              {t('vendor.startingFrom')} ${vendor.startingPrice}
            </Text>
          )}
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      className="mb-3 overflow-hidden rounded-card border border-border bg-surface"
      onPress={() => router.push(`/vendor/${vendor.id}`)}
    >
      <View className="h-40 bg-surface-tertiary">
        {vendor.coverImage ? (
          <Image source={{ uri: vendor.coverImage }} className="h-full w-full" resizeMode="cover" />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <Ionicons name="business-outline" size={40} color="#868e96" />
          </View>
        )}
        {vendor.isVerified && (
          <View className="absolute top-2 right-2 flex-row items-center rounded-full bg-brand-600 px-2 py-0.5">
            <Ionicons name="checkmark-circle" size={14} color="#fff" />
          </View>
        )}
      </View>
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
            <Text className="ml-1 text-sm font-medium text-content">
              {vendor.rating.toFixed(1)}
            </Text>
            <Text className="ml-1 text-sm text-content-tertiary">
              ({t('vendor.reviewCount', { count: vendor.reviewCount })})
            </Text>
          </View>
          {vendor.startingPrice != null && (
            <Text className="text-sm font-semibold text-brand-600">
              {t('vendor.startingFrom')} ${vendor.startingPrice}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}
