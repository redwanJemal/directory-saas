import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  Modal,
  Share,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { useState, useCallback } from 'react';
import {
  useVendor,
  useVendorPortfolio,
  useVendorPackages,
  useVendorReviews,
  type PortfolioItem,
  type VendorPackage,
  type Review,
} from '@/hooks/api/use-vendors';
import { Skeleton } from '@/components/skeleton';
import { EmptyState } from '@/components/empty-state';
import { InquiryBottomSheet } from '@/components/inquiry-bottom-sheet';

const SCREEN_WIDTH = Dimensions.get('window').width;
const TAB_KEYS = ['about', 'portfolio', 'packages', 'reviews', 'faq'] as const;

export default function VendorProfileScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<(typeof TAB_KEYS)[number]>('about');
  const [showInquiry, setShowInquiry] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const { data: vendor, isLoading, refetch } = useVendor(id);
  const { data: portfolio } = useVendorPortfolio(id);
  const { data: packages } = useVendorPackages(id);
  const { data: reviews } = useVendorReviews(id);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleShare = async () => {
    if (!vendor) return;
    try {
      await Share.share({
        message: `${vendor.businessName} - ${vendor.category}`,
      });
    } catch {
      // User cancelled
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <Skeleton height={250} borderRadius={0} width="100%" />
        <View className="p-4">
          <Skeleton width="60%" height={24} />
          <Skeleton width="40%" height={16} className="mt-2" />
          <Skeleton width="50%" height={16} className="mt-1" />
          <View className="mt-4 flex-row">
            <Skeleton width="30%" height={40} className="mr-2" />
            <Skeleton width="30%" height={40} className="mr-2" />
            <Skeleton width="30%" height={40} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!vendor) {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <EmptyState
          icon="alert-circle-outline"
          title={t('errors.notFound')}
          actionTitle={t('common.back')}
          onAction={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  const portfolioItems = (portfolio as PortfolioItem[] | undefined) ?? [];
  const packageItems = (packages as VendorPackage[] | undefined) ?? [];
  const reviewItems = (reviews as Review[] | undefined) ?? [];

  const starDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviewItems.filter((r) => Math.round(r.rating) === star).length,
  }));

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4c6ef5" />
        }
      >
        {/* Hero Image */}
        <View className="relative h-64 bg-surface-tertiary">
          {vendor.coverImage ? (
            <Image
              source={{ uri: vendor.coverImage }}
              className="h-full w-full"
              resizeMode="cover"
            />
          ) : (
            <View className="h-full w-full items-center justify-center">
              <Ionicons name="business-outline" size={64} color="#868e96" />
            </View>
          )}
          <Pressable
            className="absolute top-3 left-3 h-9 w-9 items-center justify-center rounded-full bg-black/40"
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </Pressable>
        </View>

        {/* Vendor Info */}
        <View className="px-4 pt-4">
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text className="text-xl font-bold text-content">{vendor.businessName}</Text>
                {vendor.isVerified && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color="#4c6ef5"
                    style={{ marginLeft: 6 }}
                  />
                )}
              </View>
              <Text className="mt-0.5 text-sm text-content-secondary">{vendor.category}</Text>
              <View className="mt-1 flex-row items-center">
                <Ionicons name="location-outline" size={14} color="#868e96" />
                <Text className="ml-1 text-sm text-content-tertiary">{vendor.location}</Text>
              </View>
            </View>
          </View>

          {/* Stats Row */}
          <View className="mt-3 flex-row items-center">
            <View className="flex-row items-center">
              <Ionicons name="star" size={16} color="#fab005" />
              <Text className="ml-1 text-base font-bold text-content">
                {vendor.rating.toFixed(1)}
              </Text>
              <Text className="ml-1 text-sm text-content-tertiary">
                ({t('vendor.reviewCount', { count: vendor.reviewCount })})
              </Text>
            </View>
            {vendor.startingPrice != null && (
              <Text className="ml-4 text-sm font-semibold text-brand-600">
                {t('vendor.startingFrom')} ${vendor.startingPrice}
              </Text>
            )}
          </View>

          {/* Action Buttons */}
          <View className="mt-4 flex-row">
            <Pressable
              className="mr-2 flex-1 items-center rounded-button bg-brand-600 py-3"
              onPress={() => setShowInquiry(true)}
            >
              <Text className="font-semibold text-content-inverse">
                {t('vendor.requestQuote')}
              </Text>
            </Pressable>
            <Pressable className="mr-2 items-center justify-center rounded-button border border-border px-4 py-3">
              <Ionicons name="bookmark-outline" size={20} color="#495057" />
            </Pressable>
            <Pressable
              className="items-center justify-center rounded-button border border-border px-4 py-3"
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={20} color="#495057" />
            </Pressable>
          </View>
        </View>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-4 border-b border-border"
          contentContainerClassName="px-4"
        >
          {TAB_KEYS.map((tab) => (
            <Pressable
              key={tab}
              className={`mr-5 pb-3 ${
                activeTab === tab ? 'border-b-2 border-brand-600' : ''
              }`}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                className={`text-sm font-medium ${
                  activeTab === tab ? 'text-brand-600' : 'text-content-tertiary'
                }`}
              >
                {t(`vendor.${tab}`)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Tab Content */}
        <View className="px-4 py-4">
          {activeTab === 'about' && <AboutTab vendor={vendor} />}
          {activeTab === 'portfolio' && (
            <PortfolioTab items={portfolioItems} onImagePress={setFullscreenImage} />
          )}
          {activeTab === 'packages' && <PackagesTab items={packageItems} />}
          {activeTab === 'reviews' && (
            <ReviewsTab
              items={reviewItems}
              rating={vendor.rating}
              starDistribution={starDistribution}
            />
          )}
          {activeTab === 'faq' && <FaqTab />}
        </View>
      </ScrollView>

      {/* Floating Request Quote Button */}
      <View className="border-t border-border bg-surface px-4 py-3">
        <Pressable
          className="items-center rounded-button bg-brand-600 py-3.5"
          onPress={() => setShowInquiry(true)}
        >
          <Text className="font-semibold text-content-inverse">{t('vendor.requestQuote')}</Text>
        </Pressable>
      </View>

      {/* Inquiry Bottom Sheet */}
      <InquiryBottomSheet
        visible={showInquiry}
        onClose={() => setShowInquiry(false)}
        vendorId={id}
        vendorName={vendor.businessName}
      />

      {/* Fullscreen Image Modal */}
      <Modal visible={!!fullscreenImage} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black">
          <Pressable
            className="absolute top-12 right-4 z-10 h-10 w-10 items-center justify-center rounded-full bg-white/20"
            onPress={() => setFullscreenImage(null)}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </Pressable>
          {fullscreenImage && (
            <Image
              source={{ uri: fullscreenImage }}
              style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function AboutTab({
  vendor,
}: {
  vendor: {
    description: string;
    phone?: string;
    email?: string;
    website?: string;
    operatingHours?: Record<string, string>;
  };
}) {
  const { t } = useTranslation();
  return (
    <View>
      <Text className="text-sm leading-6 text-content">{vendor.description}</Text>
      {(vendor.phone || vendor.email || vendor.website) && (
        <View className="mt-4 rounded-card border border-border p-3">
          {vendor.phone && (
            <View className="mb-2 flex-row items-center">
              <Ionicons name="call-outline" size={16} color="#868e96" />
              <Text className="ml-2 text-sm text-content">{vendor.phone}</Text>
            </View>
          )}
          {vendor.email && (
            <View className="mb-2 flex-row items-center">
              <Ionicons name="mail-outline" size={16} color="#868e96" />
              <Text className="ml-2 text-sm text-content">{vendor.email}</Text>
            </View>
          )}
          {vendor.website && (
            <View className="flex-row items-center">
              <Ionicons name="globe-outline" size={16} color="#868e96" />
              <Text className="ml-2 text-sm text-brand-600">{vendor.website}</Text>
            </View>
          )}
        </View>
      )}
      {vendor.operatingHours && Object.keys(vendor.operatingHours).length > 0 && (
        <View className="mt-4">
          <Text className="mb-2 text-sm font-semibold text-content">{t('vendor.about')}</Text>
          {Object.entries(vendor.operatingHours).map(([day, hours]) => (
            <View key={day} className="flex-row justify-between py-1">
              <Text className="text-sm text-content-secondary">{day}</Text>
              <Text className="text-sm text-content">{hours}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function PortfolioTab({
  items,
  onImagePress,
}: {
  items: PortfolioItem[];
  onImagePress: (url: string) => void;
}) {
  const { t } = useTranslation();
  if (items.length === 0) {
    return <EmptyState icon="images-outline" title={t('vendor.portfolio')} />;
  }
  const imageWidth = (SCREEN_WIDTH - 48) / 2;
  return (
    <View className="flex-row flex-wrap justify-between">
      {items.map((item) => (
        <Pressable
          key={item.id}
          className="mb-2 overflow-hidden rounded-card"
          onPress={() => onImagePress(item.imageUrl)}
        >
          <Image
            source={{ uri: item.imageUrl }}
            style={{ width: imageWidth, height: imageWidth }}
            resizeMode="cover"
          />
        </Pressable>
      ))}
    </View>
  );
}

function PackagesTab({ items }: { items: VendorPackage[] }) {
  const { t } = useTranslation();
  if (items.length === 0) {
    return <EmptyState icon="pricetag-outline" title={t('vendor.noPackages')} />;
  }
  return (
    <View>
      {items.map((pkg) => (
        <View key={pkg.id} className="mb-3 rounded-card border border-border p-4">
          <View className="flex-row items-start justify-between">
            <Text className="flex-1 text-base font-semibold text-content">{pkg.name}</Text>
            <Text className="text-lg font-bold text-brand-600">${pkg.price}</Text>
          </View>
          <Text className="mt-1 text-sm text-content-secondary">{pkg.description}</Text>
          {pkg.includes.length > 0 && (
            <View className="mt-2">
              {pkg.includes.map((item, index) => (
                <View key={index} className="mt-1 flex-row items-center">
                  <Ionicons name="checkmark-circle" size={14} color="#40c057" />
                  <Text className="ml-2 text-sm text-content">{item}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

function ReviewsTab({
  items,
  rating,
  starDistribution,
}: {
  items: Review[];
  rating: number;
  starDistribution: { star: number; count: number }[];
}) {
  const { t } = useTranslation();
  const maxCount = Math.max(...starDistribution.map((s) => s.count), 1);

  if (items.length === 0) {
    return <EmptyState icon="chatbubble-outline" title={t('vendor.noReviews')} />;
  }

  return (
    <View>
      <View className="mb-4 flex-row items-center rounded-card bg-surface-secondary p-4">
        <View className="mr-4 items-center">
          <Text className="text-3xl font-bold text-content">{rating.toFixed(1)}</Text>
          <View className="mt-1 flex-row">
            {[1, 2, 3, 4, 5].map((s) => (
              <Ionicons
                key={s}
                name={s <= Math.round(rating) ? 'star' : 'star-outline'}
                size={14}
                color="#fab005"
              />
            ))}
          </View>
          <Text className="mt-1 text-xs text-content-tertiary">
            {t('vendor.reviewCount', { count: items.length })}
          </Text>
        </View>
        <View className="flex-1">
          {starDistribution.map(({ star, count }) => (
            <View key={star} className="mb-1 flex-row items-center">
              <Text className="w-4 text-xs text-content-tertiary">{star}</Text>
              <View className="ml-1 mr-2 h-2 flex-1 overflow-hidden rounded-full bg-border">
                <View
                  className="h-full rounded-full bg-warning-500"
                  style={{ width: `${(count / maxCount) * 100}%` }}
                />
              </View>
              <Text className="w-6 text-xs text-content-tertiary">{count}</Text>
            </View>
          ))}
        </View>
      </View>
      {items.map((review) => (
        <View key={review.id} className="mb-3 border-b border-border pb-3">
          <View className="flex-row items-center">
            <View className="h-8 w-8 items-center justify-center rounded-full bg-brand-100">
              {review.userAvatar ? (
                <Image source={{ uri: review.userAvatar }} className="h-8 w-8 rounded-full" />
              ) : (
                <Text className="text-sm font-semibold text-brand-600">
                  {review.userName.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <View className="ml-2 flex-1">
              <Text className="text-sm font-medium text-content">{review.userName}</Text>
              <View className="flex-row items-center">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons
                    key={s}
                    name={s <= review.rating ? 'star' : 'star-outline'}
                    size={10}
                    color="#fab005"
                  />
                ))}
                <Text className="ml-2 text-xs text-content-tertiary">
                  {new Date(review.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
          <Text className="mt-2 text-sm text-content">{review.comment}</Text>
        </View>
      ))}
    </View>
  );
}

function FaqTab() {
  const { t } = useTranslation();
  return <EmptyState icon="help-circle-outline" title={t('vendor.faq')} />;
}
