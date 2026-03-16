import { View, Text, Pressable, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useCategories, type Category } from '@/hooks/api/use-categories';
import { getCategoryIcon } from '@/lib/category-icons';

export interface SearchFilters {
  category?: string;
  priceMin?: number;
  priceMax?: number;
  ratingMin?: number;
  sort?: string;
}

interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onApply: (filters: SearchFilters) => void;
}

const PRICE_OPTIONS = [
  { label: '$0 - $500', min: 0, max: 500 },
  { label: '$500 - $1,000', min: 500, max: 1000 },
  { label: '$1,000 - $5,000', min: 1000, max: 5000 },
  { label: '$5,000 - $10,000', min: 5000, max: 10000 },
  { label: '$10,000+', min: 10000, max: undefined },
];

const SORT_OPTIONS = [
  { key: '', labelKey: 'search.relevance' },
  { key: 'startingPrice', labelKey: 'search.priceLowToHigh' },
  { key: '-startingPrice', labelKey: 'search.priceHighToLow' },
  { key: '-rating', labelKey: 'search.highestRated' },
];

export function FilterBottomSheet({ visible, onClose, filters, onApply }: FilterBottomSheetProps) {
  const { t } = useTranslation();
  const { data: categories } = useCategories();
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);

  useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
    }
  }, [visible, filters]);

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleClear = () => {
    const cleared: SearchFilters = {};
    setLocalFilters(cleared);
    onApply(cleared);
    onClose();
  };

  const selectedPriceIndex = PRICE_OPTIONS.findIndex(
    (p) => p.min === localFilters.priceMin && p.max === localFilters.priceMax,
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="max-h-[85%] rounded-t-3xl bg-surface pb-8">
          {/* Handle bar */}
          <View className="items-center py-3">
            <View className="h-1 w-10 rounded-full bg-border" />
          </View>

          {/* Header */}
          <View className="flex-row items-center justify-between px-4 pb-3">
            <Text className="text-lg font-bold text-content">{t('search.filters')}</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="#495057" />
            </Pressable>
          </View>

          <ScrollView className="px-4" showsVerticalScrollIndicator={false}>
            {/* Category */}
            <Text className="mb-2 text-sm font-semibold text-content">{t('search.category')}</Text>
            <View className="mb-4 flex-row flex-wrap">
              {(categories as Category[] | undefined)?.map((cat) => {
                const isSelected = localFilters.category === cat.slug;
                return (
                  <Pressable
                    key={cat.id}
                    className={`mb-2 mr-2 flex-row items-center rounded-full px-3 py-1.5 ${
                      isSelected ? 'bg-brand-600' : 'bg-surface-secondary'
                    }`}
                    onPress={() =>
                      setLocalFilters((prev) => ({
                        ...prev,
                        category: isSelected ? undefined : cat.slug,
                      }))
                    }
                  >
                    <Ionicons
                      name={getCategoryIcon(cat.slug)}
                      size={14}
                      color={isSelected ? '#fff' : '#495057'}
                    />
                    <Text
                      className={`ml-1.5 text-sm ${
                        isSelected ? 'font-semibold text-content-inverse' : 'text-content'
                      }`}
                    >
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Price Range */}
            <Text className="mb-2 text-sm font-semibold text-content">
              {t('search.priceRange')}
            </Text>
            <View className="mb-4 flex-row flex-wrap">
              {PRICE_OPTIONS.map((option, index) => {
                const isSelected = selectedPriceIndex === index;
                return (
                  <Pressable
                    key={option.label}
                    className={`mb-2 mr-2 rounded-full px-3 py-1.5 ${
                      isSelected ? 'bg-brand-600' : 'bg-surface-secondary'
                    }`}
                    onPress={() =>
                      setLocalFilters((prev) => ({
                        ...prev,
                        priceMin: isSelected ? undefined : option.min,
                        priceMax: isSelected ? undefined : option.max,
                      }))
                    }
                  >
                    <Text
                      className={`text-sm ${
                        isSelected ? 'font-semibold text-content-inverse' : 'text-content'
                      }`}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Rating */}
            <Text className="mb-2 text-sm font-semibold text-content">{t('search.rating')}</Text>
            <View className="mb-4 flex-row">
              {[1, 2, 3, 4, 5].map((star) => {
                const isSelected = localFilters.ratingMin === star;
                return (
                  <Pressable
                    key={star}
                    className={`mr-2 flex-row items-center rounded-full px-3 py-1.5 ${
                      isSelected ? 'bg-brand-600' : 'bg-surface-secondary'
                    }`}
                    onPress={() =>
                      setLocalFilters((prev) => ({
                        ...prev,
                        ratingMin: isSelected ? undefined : star,
                      }))
                    }
                  >
                    <Ionicons
                      name="star"
                      size={14}
                      color={isSelected ? '#fff' : '#fab005'}
                    />
                    <Text
                      className={`ml-1 text-sm ${
                        isSelected ? 'font-semibold text-content-inverse' : 'text-content'
                      }`}
                    >
                      {star}+
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Sort */}
            <Text className="mb-2 text-sm font-semibold text-content">{t('search.sortBy')}</Text>
            <View className="mb-6 flex-row flex-wrap">
              {SORT_OPTIONS.map((option) => {
                const isSelected = (localFilters.sort || '') === option.key;
                return (
                  <Pressable
                    key={option.key}
                    className={`mb-2 mr-2 rounded-full px-3 py-1.5 ${
                      isSelected ? 'bg-brand-600' : 'bg-surface-secondary'
                    }`}
                    onPress={() =>
                      setLocalFilters((prev) => ({
                        ...prev,
                        sort: isSelected ? undefined : option.key,
                      }))
                    }
                  >
                    <Text
                      className={`text-sm ${
                        isSelected ? 'font-semibold text-content-inverse' : 'text-content'
                      }`}
                    >
                      {t(option.labelKey)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {/* Action buttons */}
          <View className="flex-row px-4 pt-3">
            <View className="mr-2 flex-1">
              <Button title={t('search.clearFilters')} variant="outline" onPress={handleClear} />
            </View>
            <View className="ml-2 flex-1">
              <Button title={t('search.filters')} onPress={handleApply} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
