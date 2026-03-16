import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  value: string | number;
}

export function StatCard({ icon, iconColor, label, value }: StatCardProps) {
  return (
    <View className="flex-1 rounded-card bg-surface-secondary p-3">
      <Ionicons name={icon} size={20} color={iconColor} />
      <Text className="mt-1.5 text-xl font-bold text-content">{value}</Text>
      <Text className="text-xs text-content-secondary" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
