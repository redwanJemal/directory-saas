import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Button } from '@/components/ui/button';

export default function BookingsScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="px-4 pt-4">
        <Text className="text-2xl font-bold text-content">
          {t('bookings.title')}
        </Text>
      </View>
      <View className="flex-1 items-center justify-center px-6">
        <Ionicons name="calendar-outline" size={64} color="#ced4da" />
        <Text className="mt-4 text-lg font-medium text-content">
          {t('bookings.noBookings')}
        </Text>
        <View className="mt-6 w-full">
          <Button
            title={t('bookings.findVendors')}
            onPress={() => router.navigate('/(main)/search')}
            variant="primary"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
