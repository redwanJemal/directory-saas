import { type ExpoConfig, type ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: process.env.EXPO_PUBLIC_APP_NAME || 'Directory SaaS',
  slug: 'directory-saas',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'directory-saas',
  userInterfaceStyle: 'automatic',
  newArchEnabled: false,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#4c6ef5',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier:
      process.env.EXPO_PUBLIC_IOS_BUNDLE_ID || 'com.directory.saas',
    infoPlist: {
      NSCameraUsageDescription: 'Camera access is needed to scan QR codes',
      NSLocationWhenInUseUsageDescription:
        'Location access helps find nearby vendors',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#4c6ef5',
    },
    package:
      process.env.EXPO_PUBLIC_ANDROID_PACKAGE || 'com.directory.saas',
    permissions: [
      'CAMERA',
      'VIBRATE',
      'RECEIVE_BOOT_COMPLETED',
      'ACCESS_FINE_LOCATION',
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
        color: '#4c6ef5',
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
