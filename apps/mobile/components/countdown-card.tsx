import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

interface CountdownCardProps {
  daysUntilWedding: number;
  weddingDate: string;
  partnerName: string;
  userName: string;
}

export function CountdownCard({
  daysUntilWedding,
  weddingDate,
  partnerName,
  userName,
}: CountdownCardProps) {
  const { t } = useTranslation();

  const formattedDate = new Date(weddingDate).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <LinearGradient
      colors={['#4c6ef5', '#7950f2']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="mx-4 overflow-hidden rounded-card"
    >
      <View className="items-center px-6 py-6">
        <Text className="text-sm font-medium text-white/80">
          {userName} & {partnerName}
        </Text>
        <Text className="mt-2 text-5xl font-bold text-white">
          {daysUntilWedding}
        </Text>
        <Text className="mt-1 text-base font-medium text-white/90">
          {t('wedding.countdown', { days: daysUntilWedding })}
        </Text>
        <Text className="mt-2 text-sm text-white/70">{formattedDate}</Text>
      </View>
    </LinearGradient>
  );
}
