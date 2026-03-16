import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function SearchScreen() {
  const { t } = useTranslation();
  return (
    <View className="flex-1 bg-surface pt-16 px-4">
      <Text className="text-2xl font-bold text-content">{t('search.title')}</Text>
    </View>
  );
}
