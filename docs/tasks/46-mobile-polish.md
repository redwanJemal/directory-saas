# Task 46: Mobile Polish — Animations, Haptics, Notifications, Build Config

## Summary
Polish the mobile app for production readiness: add smooth animations throughout, standardize haptic feedback, implement push notifications with deep linking, add offline support with TanStack Query persistence, create global error handling, and configure production build settings with EAS.

## Current State
- Tasks 41-45 built the full mobile app: auth, search, dashboard, planning tools, messaging
- react-native-reanimated is installed but animations are minimal
- expo-haptics is used in some places but not consistently
- expo-notifications is installed but not configured
- No offline support
- No global error boundary
- EAS config exists but is basic
- App icon and splash screen are placeholders

## Required Changes

### 46.1 Animation System

Create `lib/animations.ts` with reusable animation presets:

```typescript
import {
  withSpring,
  withTiming,
  withDelay,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  FadeInDown,
  FadeInUp,
  Layout,
  type AnimationCallback,
} from 'react-native-reanimated';

// Spring configs
export const springConfig = {
  gentle: { damping: 20, stiffness: 150 },
  bouncy: { damping: 12, stiffness: 200 },
  stiff: { damping: 25, stiffness: 300 },
};

// Entering animations for list items (staggered)
export const staggeredFadeIn = (index: number) =>
  FadeInDown.delay(index * 60).springify().damping(18).stiffness(150);

// Screen transition presets
export const screenTransitions = {
  fadeIn: FadeIn.duration(200),
  fadeOut: FadeOut.duration(150),
  slideIn: SlideInRight.springify().damping(20),
  slideOut: SlideOutLeft.duration(200),
};

// Layout animation for list reordering
export const listLayout = Layout.springify().damping(18).stiffness(150);
```

**Apply animations throughout the app:**

1. **List item enter animations** — All FlatLists should use staggered fade-in:
   ```typescript
   import Animated from 'react-native-reanimated';
   import { staggeredFadeIn } from '@/lib/animations';

   // In FlatList renderItem:
   const renderItem = ({ item, index }: { item: T; index: number }) => (
     <Animated.View entering={staggeredFadeIn(index)}>
       <ItemComponent item={item} />
     </Animated.View>
   );
   ```

2. **Screen transitions** — Configure in Stack and Tab navigators:
   ```typescript
   // Stack screens
   <Stack.Screen
     options={{
       animation: 'slide_from_right',
       animationDuration: 250,
     }}
   />
   ```

3. **Pull-to-refresh spring** — Custom pull-to-refresh indicator:
   ```typescript
   // Use Reanimated shared value for pull distance
   // Spring animation on release
   const pullDistance = useSharedValue(0);
   const animatedStyle = useAnimatedStyle(() => ({
     transform: [{ translateY: withSpring(pullDistance.value, springConfig.gentle) }],
   }));
   ```

4. **Skeleton shimmer** — Enhance the existing Skeleton component:
   ```typescript
   // In components/skeleton.tsx, add shimmer effect:
   import { LinearGradient } from 'expo-linear-gradient';

   // Animated gradient that moves across the skeleton
   const translateX = useSharedValue(-width);
   useEffect(() => {
     translateX.value = withRepeat(
       withTiming(width, { duration: 1200 }),
       -1,
       false,
     );
   }, []);
   ```

5. **Tab bar icon animation** — Bounce on select:
   ```typescript
   // Custom tab bar icon wrapper
   function AnimatedTabIcon({ focused, children }: { focused: boolean; children: React.ReactNode }) {
     const scale = useSharedValue(1);

     useEffect(() => {
       if (focused) {
         scale.value = withSpring(1.15, springConfig.bouncy);
         setTimeout(() => {
           scale.value = withSpring(1, springConfig.gentle);
         }, 100);
       }
     }, [focused]);

     const animatedStyle = useAnimatedStyle(() => ({
       transform: [{ scale: scale.value }],
     }));

     return <Animated.View style={animatedStyle}>{children}</Animated.View>;
   }
   ```

6. **Countdown card** — Animated number change:
   ```typescript
   // Smooth number transition when days change
   // Use Reanimated shared value with withTiming for digit flip effect
   ```

7. **Bottom sheet animations** — All bottom sheets should slide up with spring:
   ```typescript
   // Wrap modal content in Animated.View with entering/exiting:
   entering={FadeInUp.springify().damping(20)}
   exiting={FadeOut.duration(150)}
   ```

8. **Button press animation** — Scale down on press:
   ```typescript
   // In components/ui/button.tsx, add:
   const scale = useSharedValue(1);
   const animatedStyle = useAnimatedStyle(() => ({
     transform: [{ scale: scale.value }],
   }));

   // onPressIn: scale to 0.97
   // onPressOut: spring back to 1
   ```

### 46.2 Haptic Feedback Standardization

Create `lib/haptics.ts`:

```typescript
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// No-op on web
const isNative = Platform.OS !== 'web';

export const haptics = {
  /** Light tap — button presses, tab switches, chip selections */
  light: () => {
    if (isNative) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },

  /** Medium tap — form submit, swipe actions, important interactions */
  medium: () => {
    if (isNative) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },

  /** Heavy tap — destructive actions (delete, cancel, logout) */
  heavy: () => {
    if (isNative) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },

  /** Success — booking confirmed, task completed, save successful */
  success: () => {
    if (isNative) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  /** Warning — validation error, rate limit */
  warning: () => {
    if (isNative) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },

  /** Error — login failed, API error, network error */
  error: () => {
    if (isNative) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },

  /** Selection tick — checkbox, radio, toggle */
  selection: () => {
    if (isNative) Haptics.selectionAsync();
  },
};
```

**Audit and update all interactive elements:**

| Interaction | Haptic Type |
|---|---|
| Button press (default) | `haptics.light` |
| Form submit | `haptics.medium` |
| Login/Register submit | `haptics.medium` |
| Login success | `haptics.success` |
| Login failure | `haptics.error` |
| Tab switch | `haptics.light` |
| Checkbox toggle | `haptics.selection` |
| Task completed | `haptics.success` |
| Swipe action trigger | `haptics.medium` |
| Delete action | `haptics.heavy` |
| Booking accept | `haptics.success` |
| Booking decline | `haptics.heavy` |
| Message sent | `haptics.light` |
| Pull-to-refresh trigger | `haptics.light` |
| Inquiry submitted | `haptics.success` |
| Logout | `haptics.heavy` |
| Filter applied | `haptics.light` |
| Language changed | `haptics.selection` |
| Error displayed | `haptics.warning` |

Update the `Button` component and all screens to use `haptics.*` instead of raw `Haptics.*` calls.

### 46.3 Push Notifications

Create `lib/notifications.ts`:

```typescript
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
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
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

  // Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  return tokenData.data;
}

// Handle notification tap — deep link to relevant screen
export function setupNotificationListeners() {
  // When user taps a notification
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data;

      switch (data?.type) {
        case 'new_message':
          router.push(`/(main)/chat/${data.conversationId}`);
          break;
        case 'booking_update':
          router.push(`/(main)/booking/${data.bookingId}`);
          break;
        case 'rsvp_update':
          // Navigate to guest list in planner
          router.push('/(main)/planner');
          break;
        case 'task_reminder':
          router.push('/(main)/planner');
          break;
        default:
          router.push('/(main)');
      }
    },
  );

  return subscription;
}
```

**Integration in root layout (app/_layout.tsx):**

```typescript
import { registerForPushNotifications, setupNotificationListeners } from '@/lib/notifications';

useEffect(() => {
  // Register for push notifications after auth
  if (isAuthenticated) {
    registerForPushNotifications();
  }

  // Set up notification tap listener
  const subscription = setupNotificationListeners();
  return () => subscription.remove();
}, [isAuthenticated]);
```

### 46.4 Offline Support

**TanStack Query persistence with AsyncStorage:**

Install: `@react-native-async-storage/async-storage`

Add to `apps/mobile/package.json`:
```json
{
  "dependencies": {
    "@react-native-async-storage/async-storage": "^2.1.2"
  }
}
```

Create `lib/query-persistence.ts`:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  type PersistedClient,
  type Persister,
} from '@tanstack/react-query-persist-client';

const CACHE_KEY = 'REACT_QUERY_CACHE';

export const asyncStoragePersister: Persister = {
  persistClient: async (client: PersistedClient) => {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(client));
  },
  restoreClient: async () => {
    const cache = await AsyncStorage.getItem(CACHE_KEY);
    return cache ? JSON.parse(cache) : undefined;
  },
  removeClient: async () => {
    await AsyncStorage.removeItem(CACHE_KEY);
  },
};
```

**Update root layout to use PersistQueryClientProvider:**

```typescript
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { asyncStoragePersister } from '@/lib/query-persistence';

// Replace QueryClientProvider with:
<PersistQueryClientProvider
  client={queryClient}
  persistOptions={{
    persister: asyncStoragePersister,
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
  }}
>
  {children}
</PersistQueryClientProvider>
```

Also add `@tanstack/react-query-persist-client` to dependencies.

**Offline banner component:**

Create `components/offline-banner.tsx`:

```typescript
import { View, Text } from 'react-native';
import { useEffect, useState } from 'react';
import { NetInfo } from '@react-native-community/netinfo'; // or use expo approach
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

export function OfflineBanner() {
  const { t } = useTranslation();
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Use fetch-based connectivity check or NetInfo
    const checkConnectivity = async () => {
      try {
        await fetch(process.env.EXPO_PUBLIC_API_URL + '/health', {
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
```

Add `<OfflineBanner />` in the root layout above the Stack navigator.

### 46.5 Global Error Handling

Create `components/error-boundary.tsx`:

```typescript
import { Component, type ReactNode } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import i18n from '@/i18n';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <View className="flex-1 items-center justify-center bg-surface px-8">
          <Ionicons name="warning-outline" size={64} color="#fa5252" />
          <Text className="mt-4 text-center text-lg font-semibold text-content">
            {i18n.t('common.error')}
          </Text>
          <Text className="mt-2 text-center text-sm text-content-secondary">
            {this.state.error?.message || ''}
          </Text>
          <Pressable
            className="mt-6 rounded-button bg-brand-600 px-6 py-3"
            onPress={this.resetError}
          >
            <Text className="font-semibold text-content-inverse">
              {i18n.t('common.retry')}
            </Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}
```

Create `lib/error-handler.ts` for API error toast/display:

```typescript
import { Alert, Platform } from 'react-native';
import i18n from '@/i18n';
import { haptics } from './haptics';

export function handleApiError(error: any) {
  const status = error?.response?.status;
  const message = error?.response?.data?.error?.message;

  let userMessage: string;

  switch (status) {
    case 401:
      userMessage = i18n.t('errors.unauthorized');
      break;
    case 403:
      userMessage = i18n.t('errors.forbidden');
      break;
    case 404:
      userMessage = i18n.t('errors.notFound');
      break;
    case 422:
      userMessage = message || i18n.t('errors.validationError');
      break;
    case 429:
      userMessage = i18n.t('errors.rateLimited');
      haptics.warning();
      break;
    default:
      if (!error?.response) {
        userMessage = i18n.t('errors.networkError');
      } else {
        userMessage = i18n.t('errors.serverError');
      }
      haptics.error();
  }

  if (Platform.OS === 'web') {
    // Use console or toast on web
    console.error(userMessage);
  } else {
    Alert.alert(i18n.t('common.error'), userMessage);
  }

  return userMessage;
}
```

Wrap the app in `ErrorBoundary` in the root layout.

### 46.6 App Configuration & Build

**Update app.json → app.config.ts** for dynamic configuration:

```typescript
// apps/mobile/app.config.ts
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
    bundleIdentifier: process.env.EXPO_PUBLIC_IOS_BUNDLE_ID || 'com.directory.saas',
    infoPlist: {
      NSCameraUsageDescription: 'Camera access is needed to scan QR codes',
      NSLocationWhenInUseUsageDescription: 'Location access helps find nearby vendors',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#4c6ef5',
    },
    package: process.env.EXPO_PUBLIC_ANDROID_PACKAGE || 'com.directory.saas',
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
```

**Update eas.json** with proper build profiles:

```json
{
  "cli": {
    "version": ">= 15.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_URL": "http://localhost:3333/api/v1"
      },
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.example.com/api/v1"
      },
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.example.com/api/v1"
      },
      "android": {
        "buildType": "app-bundle"
      },
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

**Update .env.example:**

```env
# API connection
EXPO_PUBLIC_API_URL=http://localhost:3333/api/v1

# App branding
EXPO_PUBLIC_APP_NAME=Directory SaaS
EXPO_PUBLIC_APP_SHORT_NAME=DS
EXPO_PUBLIC_SUPPORT_EMAIL=support@example.com

# EAS Build
EXPO_PUBLIC_PROJECT_ID=your-eas-project-id

# Platform identifiers (for white-labeling)
EXPO_PUBLIC_IOS_BUNDLE_ID=com.directory.saas
EXPO_PUBLIC_ANDROID_PACKAGE=com.directory.saas
```

**Update package.json scripts:**

```json
{
  "scripts": {
    "start": "expo start",
    "dev": "expo start --dev-client",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "lint": "eslint . --ext .ts,.tsx",
    "typecheck": "tsc --noEmit",
    "build:android-preview": "eas build -p android --profile preview",
    "build:ios-preview": "eas build -p ios --profile preview",
    "build:android-prod": "eas build -p android --profile production",
    "build:ios-prod": "eas build -p ios --profile production"
  }
}
```

### 46.7 Translation Updates

Review all components from tasks 41-46 and ensure every user-facing string uses `t()`. Update `i18n/en.json` and `i18n/am.json` with any new keys added by this task:

```json
{
  "notifications": {
    "permissionTitle": "Enable Notifications",
    "permissionMessage": "Get updates about messages, bookings, and reminders",
    "enable": "Enable",
    "later": "Later"
  }
}
```

Add corresponding Amharic translations.

## Acceptance Criteria
- [ ] List items animate in with staggered fade-in
- [ ] Screen transitions use slide/fade animations
- [ ] Bottom sheets slide up with spring animation
- [ ] Skeleton loading has shimmer effect
- [ ] Tab bar icons bounce on select
- [ ] Button press has scale-down animation
- [ ] Pull-to-refresh has spring animation
- [ ] Haptic feedback on all button taps (light)
- [ ] Haptic feedback on form submit (medium)
- [ ] Haptic feedback on destructive actions (heavy)
- [ ] Haptic feedback on success (success notification)
- [ ] Haptic feedback on errors (error notification)
- [ ] Haptic feedback on checkbox/toggle (selection)
- [ ] Push notification permission requested on first login
- [ ] Device token registered with backend
- [ ] Notification tap navigates to correct screen (deep link)
- [ ] TanStack Query cache persisted to AsyncStorage
- [ ] Offline banner shows when network unavailable
- [ ] Offline banner hides when connection restored
- [ ] Cached data available when offline
- [ ] Global error boundary catches rendering errors
- [ ] API errors show appropriate localized messages
- [ ] Network errors show "check your connection" message
- [ ] app.config.ts supports dynamic configuration via env vars
- [ ] eas.json has development, preview, production profiles
- [ ] Build scripts in package.json for preview and production
- [ ] App icon and splash screen are configurable (not hardcoded product)
- [ ] All new strings added to en.json and am.json
- [ ] TypeScript compiles with 0 errors
- [ ] App builds for web (`expo start --web`)

## Files to Create/Modify
- `apps/mobile/lib/animations.ts` (create)
- `apps/mobile/lib/haptics.ts` (create)
- `apps/mobile/lib/notifications.ts` (create)
- `apps/mobile/lib/query-persistence.ts` (create)
- `apps/mobile/lib/error-handler.ts` (create)
- `apps/mobile/components/error-boundary.tsx` (create)
- `apps/mobile/components/offline-banner.tsx` (create)
- `apps/mobile/app.config.ts` (create — replaces app.json)
- `apps/mobile/eas.json` (update)
- `apps/mobile/.env.example` (update)
- `apps/mobile/package.json` (update — add async-storage, persist-client)
- `apps/mobile/app/_layout.tsx` (update — error boundary, offline banner, persistence, notifications)
- `apps/mobile/app/(main)/_layout.tsx` (update — animated tab icons)
- `apps/mobile/components/ui/button.tsx` (update — press animation, haptics.ts import)
- `apps/mobile/components/skeleton.tsx` (update — shimmer effect)
- `apps/mobile/components/planner/checklist-view.tsx` (update — animations)
- `apps/mobile/components/planner/guest-list-view.tsx` (update — animations)
- `apps/mobile/i18n/en.json` (update)
- `apps/mobile/i18n/am.json` (update)

## Dependencies
- Task 41: Mobile App Scaffolding
- Task 42: Mobile Auth
- Task 43: Mobile Search
- Task 44: Mobile Dashboard
- Task 45: Mobile Planning Tools
