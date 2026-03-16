import { View, Text } from 'react-native';
import { useEffect, useState } from 'react';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

export function OfflineBanner() {
  const { t } = useTranslation();
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const checkConnectivity = async () => {
      try {
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3333/api/v1';
        await fetch(apiUrl.replace('/api/v1', '') + '/api/v1/health', {
          method: 'HEAD',
          cache: 'no-store',
        });
        setIsOffline(false);
      } catch {
        setIsOffline(true);
      }
    };

    const interval = setInterval(checkConnectivity, 10000);
    checkConnectivity();
    return () => clearInterval(interval);
  }, []);

  if (!isOffline) return null;

  return (
    <Animated.View
      entering={FadeInDown}
      exiting={FadeOutUp}
      className="flex-row items-center justify-center bg-warning-500 px-4 py-2"
    >
      <Ionicons name="cloud-offline-outline" size={16} color="#fff" />
      <Text className="ml-2 text-sm font-medium text-content-inverse">
        {t('common.offline')}
      </Text>
    </Animated.View>
  );
}
