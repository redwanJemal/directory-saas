import '../global.css';
import '@/i18n';
import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '@/store/auth-store';
import { asyncStoragePersister } from '@/lib/query-persistence';
import {
  registerForPushNotifications,
  setupNotificationListeners,
} from '@/lib/notifications';
import { ErrorBoundary } from '@/components/error-boundary';
import { OfflineBanner } from '@/components/offline-banner';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
      gcTime: 1000 * 60 * 60 * 24, // 24 hours for persistence
    },
  },
});

export default function RootLayout() {
  const { initialize, isLoading, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const init = async () => {
      await initialize();
      await SplashScreen.hideAsync();
    };
    init();
  }, []);

  // Register push notifications when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      registerForPushNotifications();
    }
  }, [isAuthenticated]);

  // Set up notification tap listener
  useEffect(() => {
    const subscription = setupNotificationListeners();
    return () => subscription.remove();
  }, []);

  if (isLoading) {
    return null; // Splash screen still visible
  }

  return (
    <ErrorBoundary>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: asyncStoragePersister,
          maxAge: 1000 * 60 * 60 * 24, // 24 hours
        }}
      >
        <View className="flex-1 bg-surface">
          <StatusBar style="auto" />
          <OfflineBanner />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'fade',
            }}
          >
            <Stack.Screen
              name="(auth)"
              options={{ animation: 'slide_from_bottom' }}
            />
            <Stack.Screen name="(main)" options={{ animation: 'fade' }} />
            <Stack.Screen
              name="vendor/[id]"
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="booking/[id]"
              options={{
                animation: 'slide_from_right',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="chat/[conversationId]"
              options={{
                animation: 'slide_from_right',
                headerShown: false,
              }}
            />
          </Stack>
        </View>
      </PersistQueryClientProvider>
    </ErrorBoundary>
  );
}
