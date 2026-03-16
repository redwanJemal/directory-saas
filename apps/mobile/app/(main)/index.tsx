import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth-store';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView contentContainerClassName="pb-8">
        <View className="px-4 pt-4">
          <Text className="text-2xl font-bold text-content">
            {t('home.welcome', { name: user?.name || '' })}
          </Text>
        </View>

        {/* Quick Stats */}
        <View className="mt-6 flex-row px-4">
          <View className="mr-2 flex-1 rounded-card bg-surface-secondary p-4">
            <Ionicons name="storefront-outline" size={24} color="#4c6ef5" />
            <Text className="mt-2 text-2xl font-bold text-content">0</Text>
            <Text className="text-sm text-content-secondary">
              {t('home.vendorsBooked')}
            </Text>
          </View>
          <View className="ml-2 flex-1 rounded-card bg-surface-secondary p-4">
            <Ionicons
              name="checkmark-circle-outline"
              size={24}
              color="#40c057"
            />
            <Text className="mt-2 text-2xl font-bold text-content">0</Text>
            <Text className="text-sm text-content-secondary">
              {t('home.tasksCompleted')}
            </Text>
          </View>
        </View>

        {/* Categories */}
        <View className="mt-6 px-4">
          <Text className="text-lg font-semibold text-content">
            {t('home.categories')}
          </Text>
          <View className="mt-3 flex-row flex-wrap">
            {['photography', 'catering', 'venue', 'music'].map((cat) => (
              <View
                key={cat}
                className="mb-2 mr-2 rounded-button bg-brand-50 px-4 py-2"
              >
                <Text className="text-sm font-medium text-brand-700">
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Featured */}
        <View className="mt-6 px-4">
          <Text className="text-lg font-semibold text-content">
            {t('home.featuredVendors')}
          </Text>
          <View className="mt-3 items-center rounded-card bg-surface-secondary py-8">
            <Ionicons name="search-outline" size={32} color="#ced4da" />
            <Text className="mt-2 text-content-secondary">
              {t('home.searchPlaceholder')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
