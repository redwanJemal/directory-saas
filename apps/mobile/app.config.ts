import { type ExpoConfig, type ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: process.env.EXPO_PUBLIC_APP_NAME || 'Habesha Hub',
  slug: 'habesha-hub',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'habeshahub',
  userInterfaceStyle: 'automatic',
  newArchEnabled: false,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#166534',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier:
      process.env.EXPO_PUBLIC_IOS_BUNDLE_ID || 'com.directory.saas',
    associatedDomains: [
      `applinks:${process.env.EXPO_PUBLIC_WEB_DOMAIN || 'enathager.com'}`,
    ],
    infoPlist: {
      NSCameraUsageDescription: 'Camera access is needed to scan QR codes',
      NSLocationWhenInUseUsageDescription:
        'Location access helps find nearby vendors',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#166534',
    },
    package:
      process.env.EXPO_PUBLIC_ANDROID_PACKAGE || 'com.directory.saas',
    permissions: [
      'CAMERA',
      'VIBRATE',
      'RECEIVE_BOOT_COMPLETED',
      'ACCESS_FINE_LOCATION',
    ],
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [
          {
            scheme: 'https',
            host: process.env.EXPO_PUBLIC_WEB_DOMAIN || 'enathager.com',
            pathPrefix: '/business/',
          },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-localization',
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#166534',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    },
  },
});
