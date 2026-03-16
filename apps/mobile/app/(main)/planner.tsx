import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

export default function PlannerScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="px-4 pt-4">
        <Text className="text-2xl font-bold text-content">
          {t('planner.title')}
        </Text>
      </View>
      <View className="flex-1 items-center justify-center px-6">
        <Ionicons name="clipboard-outline" size={64} color="#ced4da" />
        <Text className="mt-4 text-center text-lg font-medium text-content">
          {t('wedding.setup')}
        </Text>
        <Text className="mt-2 text-center text-content-secondary">
          {t('planner.checklist')} · {t('planner.guests')} · {t('planner.budget')}
        </Text>
      </View>
    </SafeAreaView>
  );
}
