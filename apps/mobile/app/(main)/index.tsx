import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth-store';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  return (
    <View className="flex-1 bg-surface pt-16 px-4">
      <Text className="text-2xl font-bold text-content">
        {t('home.welcome', { name: user?.name || '' })}
      </Text>
    </View>
  );
}
