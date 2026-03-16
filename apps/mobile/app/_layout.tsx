import '../global.css';
import '@/i18n';
import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '@/store/auth-store';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

export default function RootLayout() {
  const { initialize, isLoading } = useAuthStore();

  useEffect(() => {
    const init = async () => {
      await initialize();
      await SplashScreen.hideAsync();
    };
    init();
  }, []);

  if (isLoading) {
    return null; // Splash screen still visible
  }

  return (
    <QueryClientProvider client={queryClient}>
      <View className="flex-1 bg-surface">
        <StatusBar style="auto" />
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
        </Stack>
      </View>
    </QueryClientProvider>
  );
}
