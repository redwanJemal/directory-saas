import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function LoginScreen() {
  const { t } = useTranslation();
  return (
    <View className="flex-1 items-center justify-center bg-surface">
      <Text className="text-2xl font-bold text-content">{t('auth.login')}</Text>
      <Text className="mt-2 text-content-secondary">{t('auth.loginSubtitle')}</Text>
    </View>
  );
}
