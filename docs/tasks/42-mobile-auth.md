# Task 42: Mobile Auth — Login, Register, Protected Navigation

## Summary
Implement complete authentication screens (login, register, forgot password) with Zod validation, haptic feedback, animated transitions, and protected navigation. Set up the full tab navigation with 5 tabs: Home, Search, Bookings, Planner, Profile. All text uses i18n `t()`, all colors from theme.

## Current State
- Task 41 scaffolded the mobile app with Expo Router, NativeWind, i18n, Zustand auth store, and Axios client
- `store/auth-store.ts` has `login()`, `register()`, `logout()`, `initialize()` methods
- `lib/api.ts` has token refresh interceptor
- `(auth)` and `(main)` route groups exist with placeholders
- Backend auth endpoints: `POST /api/v1/auth/client/login`, `POST /api/v1/auth/client/register`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`
- Backend returns `{ accessToken, refreshToken, user }` wrapped in the standard envelope

## Required Changes

### 42.1 Navigation Structure

Update the route structure:

```
app/
├── _layout.tsx              # Root layout (providers, splash, auth init)
├── index.tsx                # Entry redirect (auth state check)
├── (auth)/                  # Public auth stack
│   ├── _layout.tsx          # Stack navigator
│   ├── login.tsx            # Login screen
│   ├── register.tsx         # Register screen
│   └── forgot-password.tsx  # Forgot password screen
└── (main)/                  # Protected tab navigator
    ├── _layout.tsx          # Tab navigator with 5 tabs
    ├── index.tsx            # Home / Dashboard
    ├── search.tsx           # Vendor Search
    ├── bookings.tsx         # My Bookings
    ├── planner.tsx          # Wedding Planner
    ├── profile.tsx          # Profile & Settings
    └── vendor/
        └── [id].tsx         # Vendor detail (stack push from search)
```

### 42.2 Auth Validation Schemas

Create `lib/auth-schemas.ts`:

```typescript
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('auth.emailRequired'),
  password: z.string().min(1, 'auth.passwordRequired'),
});
export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(2, 'auth.nameRequired'),
  email: z.string().email('auth.emailRequired'),
  password: z.string().min(8, 'auth.passwordMinLength'),
  confirmPassword: z.string(),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'auth.termsAgree' }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'auth.passwordsDoNotMatch',
  path: ['confirmPassword'],
});
export type RegisterFormData = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('auth.emailRequired'),
});
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
```

### 42.3 Reusable Form Components

Create `components/ui/input.tsx`:

```typescript
import { TextInput, View, Text, type TextInputProps } from 'react-native';
import { forwardRef } from 'react';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <View className="mb-4">
        <Text className="mb-1.5 text-sm font-medium text-content">{label}</Text>
        <TextInput
          ref={ref}
          className={`rounded-input border px-4 py-3 text-base text-content ${
            error ? 'border-danger-500' : 'border-border'
          } bg-surface`}
          placeholderTextColor="#868e96"
          {...props}
        />
        {error && (
          <Text className="mt-1 text-sm text-danger-500">{error}</Text>
        )}
      </View>
    );
  },
);
```

Create `components/ui/button.tsx`:

```typescript
import { Pressable, Text, ActivityIndicator, type PressableProps } from 'react-native';
import * as Haptics from 'expo-haptics';

interface ButtonProps extends PressableProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  loading?: boolean;
  haptic?: 'light' | 'medium' | 'heavy';
}

const variantStyles = {
  primary: { container: 'bg-brand-600', text: 'text-content-inverse' },
  secondary: { container: 'bg-surface-secondary', text: 'text-content' },
  outline: { container: 'border border-border bg-transparent', text: 'text-content' },
  danger: { container: 'bg-danger-500', text: 'text-content-inverse' },
};

export function Button({
  title,
  variant = 'primary',
  loading,
  haptic = 'light',
  onPress,
  disabled,
  ...props
}: ButtonProps) {
  const styles = variantStyles[variant];

  const handlePress = (e: any) => {
    if (haptic === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    else if (haptic === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    else if (haptic === 'heavy') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onPress?.(e);
  };

  return (
    <Pressable
      className={`rounded-button px-6 py-3.5 ${styles.container} ${
        (disabled || loading) ? 'opacity-50' : 'active:opacity-80'
      }`}
      disabled={disabled || loading}
      onPress={handlePress}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : '#4c6ef5'} />
      ) : (
        <Text className={`text-center text-base font-semibold ${styles.text}`}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
```

### 42.4 Login Screen

**app/(auth)/login.tsx:**

Full login screen with:
- App logo/branding from `lib/config.ts` (configurable name, not hardcoded)
- Email + password form fields using `Input` component
- Zod validation via `react-hook-form` + `@hookform/resolvers`
- Loading state with spinner on submit button
- Error display (from API or validation)
- Haptic feedback (medium) on submit
- "Forgot Password?" link → `/(auth)/forgot-password`
- "Don't have an account? Sign Up" link → `/(auth)/register`
- All text via `t()` from `react-i18next`
- All colors via NativeWind theme classes (bg-surface, text-content, bg-brand-600, etc.)
- On success: store tokens, navigate to `/(main)`
- KeyboardAvoidingView for proper keyboard handling
- SafeAreaView for notch/status bar

```typescript
// Key implementation pattern:
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '@/lib/auth-schemas';
import { useAuthStore } from '@/store/auth-store';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

// In component:
const { t } = useTranslation();
const { login, error, clearError } = useAuthStore();
const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
  resolver: zodResolver(loginSchema),
});

const onSubmit = async (data: LoginFormData) => {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  try {
    await login(data.email, data.password);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/(main)');
  } catch {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
};
```

### 42.5 Register Screen

**app/(auth)/register.tsx:**

Register screen with:
- App branding header (configurable)
- Name, email, password, confirm password fields with Zod validation
- Terms of service checkbox
- Submit with haptic feedback
- Error display
- "Already have an account? Sign In" link
- On success: store tokens, navigate to `/(main)`
- Calls `POST /api/v1/auth/client/register` with `{ name, email, password }`
- ScrollView for long form
- All text via `t()`, all colors via theme

### 42.6 Forgot Password Screen

**app/(auth)/forgot-password.tsx:**

- Email input with Zod validation
- "Send Reset Link" button
- Success message after submission
- Back to login link
- Calls `POST /api/v1/auth/forgot-password` (if endpoint exists, otherwise show "feature coming soon")
- All text via `t()`, all colors via theme

### 42.7 Protected Tab Navigation

**app/(main)/_layout.tsx:**

Update to 5 tabs with custom styling:

```typescript
import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth-store';

export default function MainLayout() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthStore();

  // Protected: redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4c6ef5',  // brand-600
        tabBarInactiveTintColor: '#868e96', // content-tertiary
        tabBarStyle: {
          backgroundColor: '#ffffff',       // surface
          borderTopColor: '#dee2e6',        // border
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t('tabs.search'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: t('tabs.bookings'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          title: t('tabs.planner'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="clipboard-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

### 42.8 Profile Screen with Settings

**app/(main)/profile.tsx:**

Full profile screen with:
- User info section: avatar placeholder, name, email
- "Edit Profile" button
- Settings section:
  - Language switcher (English / Amharic) with `i18n.changeLanguage()`
  - Notifications toggle (placeholder)
- About section: app version from `expo-constants`
- Logout button with confirmation alert
- Haptic feedback on logout (heavy)
- All text via `t()`, all colors from theme

```typescript
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';

const handleLogout = () => {
  Alert.alert(t('auth.logout'), t('profile.logoutConfirm'), [
    { text: t('common.cancel'), style: 'cancel' },
    {
      text: t('auth.logout'),
      style: 'destructive',
      onPress: async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        await logout();
        router.replace('/(auth)/login');
      },
    },
  ]);
};
```

### 42.9 Placeholder Tab Screens

Create placeholder implementations for tabs that will be built in later tasks:

**app/(main)/bookings.tsx** — Shows "No bookings yet" empty state with "Find Vendors" button linking to search tab.

**app/(main)/planner.tsx** — Shows "Set up your wedding to access planning tools" message or placeholder.

### 42.10 Animated Transitions

In the root `_layout.tsx`, configure animation between auth and main stacks:

```typescript
<Stack
  screenOptions={{
    headerShown: false,
    animation: 'fade',  // Smooth transition between auth ↔ main
  }}
>
  <Stack.Screen name="(auth)" options={{ animation: 'slide_from_bottom' }} />
  <Stack.Screen name="(main)" options={{ animation: 'fade' }} />
</Stack>
```

## Acceptance Criteria
- [ ] Login screen renders with email + password fields, all text localized
- [ ] Login form validates with Zod (email format, password required)
- [ ] Login calls `POST /api/v1/auth/client/login` with real API
- [ ] Tokens stored in SecureStore (localStorage on web) after login
- [ ] Register screen with name, email, password, confirm password, terms checkbox
- [ ] Register validates with Zod (password match, min length, terms)
- [ ] Register calls `POST /api/v1/auth/client/register`
- [ ] Forgot password screen with email input
- [ ] Auth error messages display from API response
- [ ] Haptic feedback on submit (medium), success (notification), error (notification)
- [ ] Auto-login works: app start → check token → `/auth/me` → navigate to main
- [ ] Protected navigation: `(main)` redirects to login when not authenticated
- [ ] Tab bar shows 5 tabs: Home, Search, Bookings, Planner, Profile
- [ ] Tab bar uses brand colors from theme
- [ ] Profile screen shows user info, language switcher, logout
- [ ] Language toggle switches all text between English and Amharic
- [ ] Logout clears tokens, redirects to login
- [ ] Animated transitions between auth and main stacks
- [ ] No hardcoded text — all strings via `t()`
- [ ] No hardcoded colors in component files — all via NativeWind theme classes
- [ ] TypeScript compiles with 0 errors

## Files to Create/Modify
- `apps/mobile/lib/auth-schemas.ts` (create)
- `apps/mobile/components/ui/input.tsx` (create)
- `apps/mobile/components/ui/button.tsx` (create)
- `apps/mobile/app/(auth)/login.tsx` (rewrite)
- `apps/mobile/app/(auth)/register.tsx` (create)
- `apps/mobile/app/(auth)/forgot-password.tsx` (create)
- `apps/mobile/app/(main)/_layout.tsx` (rewrite — 5 tabs + auth guard)
- `apps/mobile/app/(main)/index.tsx` (update)
- `apps/mobile/app/(main)/search.tsx` (update placeholder)
- `apps/mobile/app/(main)/bookings.tsx` (create)
- `apps/mobile/app/(main)/planner.tsx` (create)
- `apps/mobile/app/(main)/profile.tsx` (rewrite)
- `apps/mobile/app/_layout.tsx` (update transitions)
- `apps/mobile/i18n/en.json` (update if needed)
- `apps/mobile/i18n/am.json` (update if needed)

## Dependencies
- Task 41: Mobile App Scaffolding
