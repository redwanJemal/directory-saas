import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { api } from './api';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  // Get Expo push token
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
  });

  // Register token with backend
  try {
    await api.post('/notifications/register-device', {
      token: tokenData.data,
      platform: Platform.OS,
    });
  } catch (error) {
    console.error('Failed to register push token:', error);
  }

  // Android notification channels
  if (Platform.OS === 'android') {
    await Promise.all([
      Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      }),
      Notifications.setNotificationChannelAsync('deals', {
        name: 'Deals & Promotions',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
      }),
      Notifications.setNotificationChannelAsync('new_businesses', {
        name: 'New Businesses',
        importance: Notifications.AndroidImportance.DEFAULT,
      }),
    ]);
  }

  return tokenData.data;
}

// Handle notification tap — deep link to relevant screen
export function setupNotificationListeners() {
  const subscription =
    Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;

      switch (data?.type) {
        case 'new_message':
          router.push(`/chat/${data.conversationId}` as any);
          break;
        case 'booking_update':
          router.push(`/booking/${data.bookingId}` as any);
          break;
        case 'new_deal':
          if (data.providerId) {
            router.push(`/vendor/${data.providerId}` as any);
          } else {
            router.push('/(main)/search' as any);
          }
          break;
        case 'new_business':
          if (data.providerId) {
            router.push(`/vendor/${data.providerId}` as any);
          } else {
            router.push('/(main)/search' as any);
          }
          break;
        case 'deal_expiring':
          router.push(`/vendor/${data.providerId}` as any);
          break;
        default:
          router.push('/(main)' as any);
      }
    });

  return subscription;
}
