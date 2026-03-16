import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionTitle?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, subtitle, actionTitle, onAction }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <Ionicons name={icon} size={64} color="#868e96" />
      <Text className="mt-4 text-center text-lg font-semibold text-content">{title}</Text>
      {subtitle && (
        <Text className="mt-2 text-center text-sm text-content-secondary">{subtitle}</Text>
      )}
      {actionTitle && onAction && (
        <View className="mt-6">
          <Button title={actionTitle} onPress={onAction} />
        </View>
      )}
    </View>
  );
}
