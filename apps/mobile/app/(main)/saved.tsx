import { View, Text, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSavedStore, type SavedBusiness } from '@/store/saved-store';
import { EmptyState } from '@/components/empty-state';
import { VendorCard } from '@/components/vendor-card';

export default function SavedScreen() {
  const { t } = useTranslation();
  const { businesses, remove } = useSavedStore();

  const renderItem = ({ item }: { item: SavedBusiness }) => (
    <View className="relative">
      <VendorCard vendor={item} />
      <Pressable
        className="absolute top-2 right-2 h-8 w-8 items-center justify-center rounded-full bg-surface"
        onPress={() => remove(item.id)}
      >
        <Ionicons name="bookmark" size={18} color="#4c6ef5" />
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-2xl font-bold text-content">{t('saved.title')}</Text>
        {businesses.length > 0 && (
          <Text className="mt-1 text-sm text-content-secondary">
            {t('saved.count', { count: businesses.length })}
          </Text>
        )}
      </View>

      <FlatList
        data={businesses}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 pt-2 pb-4"
        ListEmptyComponent={
          <EmptyState
            icon="bookmark-outline"
            title={t('saved.noSaved')}
            subtitle={t('saved.noSavedSubtitle')}
            actionTitle={t('saved.browseBusiness')}
            onAction={() => router.navigate('/(main)/search')}
          />
        }
      />
    </SafeAreaView>
  );
}
