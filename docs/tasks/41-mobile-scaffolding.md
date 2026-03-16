# Task 41: Mobile App Scaffolding — Expo, NativeWind, Theme, i18n

## Summary
Scaffold the Expo React Native mobile app at `apps/mobile/` for the client-facing directory experience. Set up all foundational dependencies, NativeWind theming with customizable brand colors (no hardcoded colors), i18n with English and Amharic, Axios API client with token refresh, Zustand auth store with SecureStore, and basic navigation structure.

## Current State
- No mobile app exists in the project
- 3 React web apps exist at `apps/web/`, `apps/provider-portal/`, `apps/admin/`
- Backend API is fully built with JWT auth, multi-tenancy, search, etc.
- Web apps use OKLch theming with `--brand-hue` CSS variable, i18next with en/am, Zustand auth stores
- Reference mobile app at `/home/redman/amt-mobility/apps/mobile/` provides proven patterns for Expo 54 + NativeWind 4 + Zustand + TanStack Query

## Required Changes

### 41.1 Create Expo App

Create the app at `apps/mobile/` with this structure:

```
apps/mobile/
├── app/                     # Expo Router file-based routes
│   ├── _layout.tsx          # Root layout (providers, splash, auth init)
│   ├── index.tsx            # Entry redirect (auth check)
│   ├── (auth)/              # Auth stack (public)
│   │   ├── _layout.tsx
│   │   └── login.tsx        # Placeholder
│   └── (main)/              # Main tabs (protected)
│       ├── _layout.tsx      # Tab navigator
│       ├── index.tsx        # Home tab placeholder
│       ├── search.tsx       # Search tab placeholder
│       └── profile.tsx      # Profile tab placeholder
├── components/              # Reusable components
│   └── ui/                  # Base UI components
├── hooks/                   # Custom hooks
├── i18n/                    # Internationalization
│   ├── index.ts             # i18next config
│   ├── en.json              # English translations
│   └── am.json              # Amharic translations
├── lib/                     # Utilities
│   ├── api.ts               # Axios client with interceptors
│   └── config.ts            # App branding config
├── store/                   # Zustand stores
│   └── auth-store.ts        # Auth state with SecureStore
├── assets/                  # Icons, splash, images
│   ├── icon.png
│   ├── splash-icon.png
│   ├── adaptive-icon.png
│   ├── favicon.png
│   └── notification-icon.png
├── app.json                 # Expo config
├── babel.config.js          # Babel with NativeWind + Reanimated
├── metro.config.js          # Metro with NativeWind
├── tailwind.config.js       # Theme colors (brand, surface, semantic)
├── global.css               # Tailwind directives
├── tsconfig.json            # TypeScript with @/* alias
├── eas.json                 # EAS Build profiles
├── .env.example             # Environment template
├── expo-env.d.ts            # Expo type declarations
├── nativewind-env.d.ts      # NativeWind type declarations
└── package.json
```

### 41.2 Dependencies

**package.json:**

```json
{
  "name": "mobile",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "dev": "expo start --dev-client",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "build:android-preview": "eas build -p android --profile preview",
    "build:ios-preview": "eas build -p ios --profile preview",
    "lint": "eslint . --ext .ts,.tsx",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@expo/vector-icons": "^15.0.3",
    "@hookform/resolvers": "^5.2.2",
    "@tanstack/react-query": "^5.90.20",
    "axios": "^1.13.4",
    "babel-preset-expo": "^54.0.10",
    "expo": "~54.0.33",
    "expo-constants": "~18.0.13",
    "expo-haptics": "~15.0.8",
    "expo-linear-gradient": "^15.0.8",
    "expo-linking": "~8.0.11",
    "expo-localization": "~16.0.10",
    "expo-notifications": "~0.32.16",
    "expo-router": "~6.0.23",
    "expo-secure-store": "~15.0.8",
    "expo-splash-screen": "~31.0.13",
    "expo-status-bar": "~3.0.9",
    "i18next": "^25.2.1",
    "react-i18next": "^16.5.1",
    "i18next-browser-languagedetector": "^8.1.1",
    "nativewind": "^4.2.1",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "react-hook-form": "^7.71.1",
    "react-native": "0.81.5",
    "react-native-gesture-handler": "~2.28.0",
    "react-native-reanimated": "~4.1.1",
    "react-native-safe-area-context": "~5.6.0",
    "react-native-screens": "~4.16.0",
    "react-native-web": "^0.21.0",
    "zod": "^4.3.6",
    "zustand": "^5.0.11"
  },
  "devDependencies": {
    "@types/react": "~19.1.0",
    "tailwindcss": "^3.4.17",
    "typescript": "~5.9.2"
  },
  "private": true
}
```

### 41.3 NativeWind + Tailwind Theme

**tailwind.config.js** — ALL colors defined here; no hardcoded color values anywhere in the app. Changing these values rebrands the entire app:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Brand colors — change these to rebrand the entire app
        brand: {
          50: '#f0f4ff',
          100: '#dbe4ff',
          200: '#bac8ff',
          300: '#91a7ff',
          400: '#748ffc',
          500: '#5c7cfa',
          600: '#4c6ef5',
          700: '#4263eb',
          800: '#3b5bdb',
          900: '#364fc7',
          950: '#2b3f9e',
        },
        // Surface colors — backgrounds and cards
        surface: {
          DEFAULT: '#ffffff',
          secondary: '#f8f9fa',
          tertiary: '#f1f3f5',
          inverse: '#1a1b1e',
          'inverse-secondary': '#2c2e33',
        },
        // Text colors
        content: {
          DEFAULT: '#1a1b1e',
          secondary: '#495057',
          tertiary: '#868e96',
          inverse: '#ffffff',
          'inverse-secondary': '#c1c2c5',
        },
        // Semantic colors
        success: {
          50: '#ebfbee',
          500: '#40c057',
          700: '#2f9e44',
        },
        warning: {
          50: '#fff9db',
          500: '#fab005',
          700: '#e67700',
        },
        danger: {
          50: '#fff5f5',
          500: '#fa5252',
          700: '#e03131',
        },
        info: {
          50: '#e7f5ff',
          500: '#339af0',
          700: '#1c7ed6',
        },
        // Border colors
        border: {
          DEFAULT: '#dee2e6',
          secondary: '#e9ecef',
          focus: '#4c6ef5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        button: '8px',
        input: '8px',
        full: '9999px',
      },
    },
  },
  plugins: [],
};
```

**global.css:**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 41.4 Babel + Metro Configuration

**babel.config.js:**

```javascript
module.exports = function (api) {
  api.cache.using(() => process.env.EXPO_PUBLIC_PLATFORM || 'default');

  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: ['react-native-reanimated/plugin'],
  };
};
```

**metro.config.js:**

```javascript
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
```

### 41.5 App Configuration

**app.json:**

```json
{
  "expo": {
    "name": "Directory SaaS",
    "slug": "directory-saas",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "scheme": "directory-saas",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": false,
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#4c6ef5"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.directory.saas",
      "infoPlist": {
        "NSCameraUsageDescription": "Camera access is needed to scan QR codes",
        "NSLocationWhenInUseUsageDescription": "Location access helps find nearby vendors"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#4c6ef5"
      },
      "package": "com.directory.saas",
      "permissions": [
        "CAMERA",
        "VIBRATE",
        "RECEIVE_BOOT_COMPLETED",
        "ACCESS_FINE_LOCATION"
      ]
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      "expo-localization",
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#4c6ef5"
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

**eas.json:**

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
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

**.env.example:**

```env
# API connection
EXPO_PUBLIC_API_URL=http://localhost:3333/api/v1

# App branding (override defaults from lib/config.ts)
EXPO_PUBLIC_APP_NAME=Directory SaaS
EXPO_PUBLIC_APP_SHORT_NAME=DS
```

### 41.6 TypeScript Configuration

**tsconfig.json:**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".expo/types/**/*.ts",
    "expo-env.d.ts",
    "nativewind-env.d.ts"
  ]
}
```

**expo-env.d.ts:**

```typescript
/// <reference types="expo/types" />
```

**nativewind-env.d.ts:**

```typescript
/// <reference types="nativewind/types" />
```

### 41.7 API Client with Token Refresh

**lib/api.ts** — Axios client with SecureStore tokens, 401 refresh interceptor, request queuing. Follows the proven pattern from the reference app and the web app:

```typescript
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { router } from 'expo-router';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3333/api/v1';

const isWeb = Platform.OS === 'web';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token storage keys
const ACCESS_TOKEN_KEY = 'ds_access_token';
const REFRESH_TOKEN_KEY = 'ds_refresh_token';

// Token helpers with web fallback (SecureStore not available on web)
export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    if (isWeb) return localStorage.getItem(ACCESS_TOKEN_KEY);
    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },

  async setAccessToken(token: string): Promise<void> {
    if (isWeb) { localStorage.setItem(ACCESS_TOKEN_KEY, token); return; }
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
  },

  async getRefreshToken(): Promise<string | null> {
    if (isWeb) return localStorage.getItem(REFRESH_TOKEN_KEY);
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },

  async setRefreshToken(token: string): Promise<void> {
    if (isWeb) { localStorage.setItem(REFRESH_TOKEN_KEY, token); return; }
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  },

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      this.setAccessToken(accessToken),
      this.setRefreshToken(refreshToken),
    ]);
  },

  async clearTokens(): Promise<void> {
    if (isWeb) {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      return;
    }
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    ]);
  },
};

// Request interceptor — attach auth header
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await tokenStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — unwrap API envelope { success, data, ... }
api.interceptors.response.use((response) => {
  if (
    response.data &&
    typeof response.data === 'object' &&
    'success' in response.data &&
    'data' in response.data
  ) {
    response.data = response.data.data;
  }
  return response;
});

// Response interceptor — 401 token refresh with request queuing
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await tokenStorage.getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');

        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const data = response.data?.data ?? response.data;
        const newAccessToken = data.accessToken;
        const newRefreshToken = data.refreshToken;
        await tokenStorage.setTokens(newAccessToken, newRefreshToken);

        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        await tokenStorage.clearTokens();
        router.replace('/(auth)/login');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
```

### 41.8 App Branding Config

**lib/config.ts** — All branding configurable via environment variables; no hardcoded product names:

```typescript
export interface AppConfig {
  name: string;
  shortName: string;
  apiUrl: string;
  supportEmail: string;
}

export const appConfig: AppConfig = {
  name: process.env.EXPO_PUBLIC_APP_NAME || 'Directory SaaS',
  shortName: process.env.EXPO_PUBLIC_APP_SHORT_NAME || 'DS',
  apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3333/api/v1',
  supportEmail: process.env.EXPO_PUBLIC_SUPPORT_EMAIL || 'support@example.com',
};
```

### 41.9 Auth Store with SecureStore

**store/auth-store.ts** — Zustand store matching the web app pattern but using SecureStore:

```typescript
import { create } from 'zustand';
import { api, tokenStorage } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
  type: 'client';
  tenantId?: string;
  tenantSlug?: string;
  role?: {
    id: string;
    name: string;
    permissions: string[];
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  initialize: async () => {
    try {
      const token = await tokenStorage.getAccessToken();
      if (!token) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      const response = await api.get('/auth/me');
      set({
        user: response.data,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      await tokenStorage.clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email, password) => {
    try {
      set({ error: null });
      const response = await api.post('/auth/client/login', { email, password });
      const { accessToken, refreshToken, user } = response.data;
      await tokenStorage.setTokens(accessToken, refreshToken);
      set({ user, isAuthenticated: true });
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        'Login failed';
      set({ error: message });
      throw error;
    }
  },

  register: async (data) => {
    try {
      set({ error: null });
      const response = await api.post('/auth/client/register', data);
      const { accessToken, refreshToken, user } = response.data;
      await tokenStorage.setTokens(accessToken, refreshToken);
      set({ user, isAuthenticated: true });
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        'Registration failed';
      set({ error: message });
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout API errors
    }
    await tokenStorage.clearTokens();
    set({ user: null, isAuthenticated: false });
  },

  refreshUser: async () => {
    try {
      const response = await api.get('/auth/me');
      set({ user: response.data });
    } catch {
      // Silently fail
    }
  },

  clearError: () => set({ error: null }),
}));
```

### 41.10 i18n Setup

**i18n/index.ts:**

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import en from './en.json';
import am from './am.json';

const deviceLanguage = Localization.getLocales()[0]?.languageCode || 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    am: { translation: am },
  },
  lng: deviceLanguage === 'am' ? 'am' : 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
```

**i18n/en.json** — Comprehensive English translations:

```json
{
  "common": {
    "loading": "Loading...",
    "error": "Something went wrong",
    "retry": "Retry",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "confirm": "Confirm",
    "back": "Back",
    "next": "Next",
    "done": "Done",
    "search": "Search",
    "noResults": "No results found",
    "seeAll": "See All",
    "ok": "OK",
    "yes": "Yes",
    "no": "No",
    "or": "or",
    "and": "and",
    "offline": "You are offline",
    "pullToRefresh": "Pull to refresh"
  },
  "auth": {
    "login": "Log In",
    "register": "Create Account",
    "logout": "Log Out",
    "email": "Email",
    "password": "Password",
    "confirmPassword": "Confirm Password",
    "firstName": "First Name",
    "lastName": "Last Name",
    "name": "Full Name",
    "forgotPassword": "Forgot Password?",
    "resetPassword": "Reset Password",
    "sendResetLink": "Send Reset Link",
    "noAccount": "Don't have an account?",
    "haveAccount": "Already have an account?",
    "signUp": "Sign Up",
    "signIn": "Sign In",
    "termsAgree": "I agree to the Terms of Service",
    "loginSubtitle": "Welcome back! Sign in to continue.",
    "registerSubtitle": "Create your account to get started.",
    "resetSubtitle": "Enter your email and we'll send you a reset link.",
    "resetSent": "Reset link sent! Check your email.",
    "invalidCredentials": "Invalid email or password",
    "emailRequired": "Email is required",
    "passwordRequired": "Password is required",
    "passwordMinLength": "Password must be at least 8 characters",
    "passwordsDoNotMatch": "Passwords do not match",
    "nameRequired": "Name is required"
  },
  "tabs": {
    "home": "Home",
    "search": "Search",
    "bookings": "Bookings",
    "planner": "Planner",
    "profile": "Profile"
  },
  "home": {
    "welcome": "Welcome, {{name}}",
    "searchPlaceholder": "Search vendors...",
    "categories": "Categories",
    "featuredVendors": "Featured Vendors",
    "recentlyViewed": "Recently Viewed",
    "daysUntilWedding": "{{count}} days until your wedding",
    "vendorsBooked": "Vendors Booked",
    "tasksCompleted": "Tasks Done",
    "guestsConfirmed": "Guests Confirmed"
  },
  "search": {
    "title": "Find Vendors",
    "placeholder": "Search by name, category...",
    "filters": "Filters",
    "clearFilters": "Clear Filters",
    "category": "Category",
    "priceRange": "Price Range",
    "rating": "Rating",
    "style": "Style",
    "sortBy": "Sort By",
    "relevance": "Relevance",
    "priceLowToHigh": "Price: Low to High",
    "priceHighToLow": "Price: High to Low",
    "highestRated": "Highest Rated",
    "results": "{{count}} results",
    "noVendorsFound": "No vendors found",
    "tryDifferentFilters": "Try adjusting your filters"
  },
  "vendor": {
    "about": "About",
    "portfolio": "Portfolio",
    "packages": "Packages",
    "reviews": "Reviews",
    "faq": "FAQ",
    "requestQuote": "Request Quote",
    "startingFrom": "Starting from",
    "perEvent": "per event",
    "reviewCount": "{{count}} reviews",
    "saveFavorite": "Save",
    "share": "Share",
    "sendInquiry": "Send Inquiry",
    "weddingDate": "Wedding Date",
    "guestCount": "Guest Count",
    "message": "Message",
    "budgetRange": "Budget Range",
    "inquirySent": "Inquiry sent successfully!",
    "noReviews": "No reviews yet",
    "noPackages": "No packages listed"
  },
  "bookings": {
    "title": "My Bookings",
    "noBookings": "No bookings yet",
    "findVendors": "Find Vendors",
    "status": {
      "inquiry": "Inquiry",
      "quoted": "Quoted",
      "booked": "Booked",
      "completed": "Completed",
      "cancelled": "Cancelled"
    },
    "acceptQuote": "Accept Quote",
    "declineQuote": "Decline Quote",
    "viewDetails": "View Details",
    "messageVendor": "Message Vendor"
  },
  "planner": {
    "title": "Wedding Planner",
    "checklist": "Checklist",
    "guests": "Guests",
    "budget": "Budget",
    "messages": "Messages"
  },
  "checklist": {
    "title": "Checklist",
    "addTask": "Add Task",
    "all": "All",
    "overdue": "Overdue",
    "upcoming": "Upcoming",
    "completed": "Completed",
    "taskName": "Task Name",
    "dueDate": "Due Date",
    "progress": "{{done}} of {{total}} tasks completed",
    "noTasks": "No tasks yet"
  },
  "guests": {
    "title": "Guest List",
    "addGuest": "Add Guest",
    "totalGuests": "{{count}} guests",
    "attending": "Attending",
    "declined": "Declined",
    "pending": "Pending",
    "name": "Guest Name",
    "email": "Email",
    "phone": "Phone",
    "side": "Side",
    "relationship": "Relationship",
    "mealChoice": "Meal Choice",
    "rsvpStatus": "RSVP Status",
    "noGuests": "No guests added yet"
  },
  "budget": {
    "title": "Budget",
    "totalBudget": "Total Budget",
    "spent": "Spent",
    "remaining": "Remaining",
    "addExpense": "Add Expense",
    "category": "Category",
    "amount": "Amount",
    "description": "Description",
    "noExpenses": "No expenses recorded"
  },
  "messages": {
    "title": "Messages",
    "noMessages": "No messages yet",
    "typeMessage": "Type a message...",
    "send": "Send",
    "newMessage": "New Message"
  },
  "profile": {
    "title": "Profile",
    "editProfile": "Edit Profile",
    "settings": "Settings",
    "language": "Language",
    "english": "English",
    "amharic": "Amharic",
    "notifications": "Notifications",
    "about": "About",
    "version": "Version",
    "logoutConfirm": "Are you sure you want to log out?"
  },
  "wedding": {
    "setup": "Set Up Your Wedding",
    "weddingDate": "Wedding Date",
    "partnerName": "Partner's Name",
    "estimatedGuests": "Estimated Guests",
    "venue": "Venue (optional)",
    "stylePreferences": "Style Preferences",
    "createWedding": "Create Wedding",
    "countdown": "{{days}} days to go!",
    "budgetSpent": "{{percent}}% of budget spent",
    "overallProgress": "Overall Progress"
  },
  "errors": {
    "networkError": "Network error. Please check your connection.",
    "serverError": "Server error. Please try again later.",
    "unauthorized": "Session expired. Please log in again.",
    "forbidden": "You don't have permission for this action.",
    "notFound": "The requested resource was not found.",
    "rateLimited": "Too many requests. Please wait a moment.",
    "validationError": "Please check your input and try again."
  }
}
```

**i18n/am.json** — Amharic translations (same keys):

```json
{
  "common": {
    "loading": "በመጫን ላይ...",
    "error": "ችግር ተፈጥሯል",
    "retry": "እንደገና ሞክር",
    "cancel": "ሰርዝ",
    "save": "አስቀምጥ",
    "delete": "ሰርዝ",
    "confirm": "አረጋግጥ",
    "back": "ተመለስ",
    "next": "ቀጣይ",
    "done": "ተጠናቅቋል",
    "search": "ፈልግ",
    "noResults": "ምንም ውጤት አልተገኘም",
    "seeAll": "ሁሉንም ይመልከቱ",
    "ok": "እሺ",
    "yes": "አዎ",
    "no": "አይ",
    "or": "ወይም",
    "and": "እና",
    "offline": "ከመስመር ውጪ ነዎት",
    "pullToRefresh": "ለማዘመን ይጎትቱ"
  },
  "auth": {
    "login": "ግባ",
    "register": "መለያ ፍጠር",
    "logout": "ውጣ",
    "email": "ኢሜይል",
    "password": "የይለፍ ቃል",
    "confirmPassword": "የይለፍ ቃል አረጋግጥ",
    "firstName": "ስም",
    "lastName": "የአባት ስም",
    "name": "ሙሉ ስም",
    "forgotPassword": "የይለፍ ቃልዎን ረሱ?",
    "resetPassword": "የይለፍ ቃል ዳግም አስጀምር",
    "sendResetLink": "የዳግም ማስጀመሪያ ሊንክ ላክ",
    "noAccount": "መለያ የለዎትም?",
    "haveAccount": "መለያ አለዎት?",
    "signUp": "ይመዝገቡ",
    "signIn": "ይግቡ",
    "termsAgree": "የአገልግሎት ውሎችን እስማማለሁ",
    "loginSubtitle": "እንኳን ደህና መጡ! ለመቀጠል ይግቡ።",
    "registerSubtitle": "ለመጀመር መለያዎን ይፍጠሩ።",
    "resetSubtitle": "ኢሜይልዎን ያስገቡ፣ የዳግም ማስጀመሪያ ሊንክ እንልክልዎታለን።",
    "resetSent": "የዳግም ማስጀመሪያ ሊንክ ተልኳል! ኢሜይልዎን ይፈትሹ።",
    "invalidCredentials": "ትክክል ያልሆነ ኢሜይል ወይም የይለፍ ቃል",
    "emailRequired": "ኢሜይል ያስፈልጋል",
    "passwordRequired": "የይለፍ ቃል ያስፈልጋል",
    "passwordMinLength": "የይለፍ ቃል ቢያንስ 8 ቁምፊዎች መሆን አለበት",
    "passwordsDoNotMatch": "የይለፍ ቃሎቹ አይመሳሰሉም",
    "nameRequired": "ስም ያስፈልጋል"
  },
  "tabs": {
    "home": "መነሻ",
    "search": "ፈልግ",
    "bookings": "ቦታ ማስያዣ",
    "planner": "እቅድ",
    "profile": "መገለጫ"
  },
  "home": {
    "welcome": "እንኳን ደህና መጡ፣ {{name}}",
    "searchPlaceholder": "አቅራቢዎችን ፈልግ...",
    "categories": "ምድቦች",
    "featuredVendors": "ተለይተው የቀረቡ አቅራቢዎች",
    "recentlyViewed": "በቅርብ የታዩ",
    "daysUntilWedding": "{{count}} ቀናት ለሰርግዎ ቀሩ",
    "vendorsBooked": "የተያዙ አቅራቢዎች",
    "tasksCompleted": "የተጠናቀቁ ተግባራት",
    "guestsConfirmed": "የተረጋገጡ እንግዶች"
  },
  "search": {
    "title": "አቅራቢዎችን ያግኙ",
    "placeholder": "በስም፣ በምድብ ፈልግ...",
    "filters": "ማጣሪያዎች",
    "clearFilters": "ማጣሪያዎችን አጽዳ",
    "category": "ምድብ",
    "priceRange": "የዋጋ ክልል",
    "rating": "ደረጃ",
    "style": "ዘይቤ",
    "sortBy": "አስቀድም በ",
    "relevance": "ተዛምዶ",
    "priceLowToHigh": "ዋጋ: ዝቅተኛ ወደ ከፍተኛ",
    "priceHighToLow": "ዋጋ: ከፍተኛ ወደ ዝቅተኛ",
    "highestRated": "ከፍተኛ ደረጃ",
    "results": "{{count}} ውጤቶች",
    "noVendorsFound": "ምንም አቅራቢ አልተገኘም",
    "tryDifferentFilters": "ማጣሪያዎችዎን ያስተካክሉ"
  },
  "vendor": {
    "about": "ስለ",
    "portfolio": "ፖርትፎሊዮ",
    "packages": "ጥቅሎች",
    "reviews": "ግምገማዎች",
    "faq": "ጥያቄዎች",
    "requestQuote": "ዋጋ ጠይቅ",
    "startingFrom": "ከ",
    "perEvent": "በዝግጅት",
    "reviewCount": "{{count}} ግምገማዎች",
    "saveFavorite": "አስቀምጥ",
    "share": "አጋራ",
    "sendInquiry": "ጥያቄ ላክ",
    "weddingDate": "የሰርግ ቀን",
    "guestCount": "የእንግዶች ቁጥር",
    "message": "መልእክት",
    "budgetRange": "የበጀት ክልል",
    "inquirySent": "ጥያቄው በተሳካ ሁኔታ ተልኳል!",
    "noReviews": "እስካሁን ምንም ግምገማ የለም",
    "noPackages": "ምንም ጥቅል አልተዘረዘረም"
  },
  "bookings": {
    "title": "ቦታ ማስያዣዎቼ",
    "noBookings": "እስካሁን ምንም ቦታ ማስያዣ የለም",
    "findVendors": "አቅራቢዎችን ፈልግ",
    "status": {
      "inquiry": "ጥያቄ",
      "quoted": "ዋጋ ተሰጥቷል",
      "booked": "ተያዘ",
      "completed": "ተጠናቀቀ",
      "cancelled": "ተሰርዟል"
    },
    "acceptQuote": "ዋጋውን ተቀበል",
    "declineQuote": "ዋጋውን ውድቅ አድርግ",
    "viewDetails": "ዝርዝር ይመልከቱ",
    "messageVendor": "ለአቅራቢ መልእክት ላክ"
  },
  "planner": {
    "title": "የሰርግ እቅድ",
    "checklist": "የተግባር ዝርዝር",
    "guests": "እንግዶች",
    "budget": "በጀት",
    "messages": "መልእክቶች"
  },
  "checklist": {
    "title": "የተግባር ዝርዝር",
    "addTask": "ተግባር ጨምር",
    "all": "ሁሉም",
    "overdue": "ያለፈባቸው",
    "upcoming": "መጪ",
    "completed": "የተጠናቀቁ",
    "taskName": "የተግባር ስም",
    "dueDate": "የማለቂያ ቀን",
    "progress": "{{done}} ከ {{total}} ተግባራት ተጠናቅቀዋል",
    "noTasks": "እስካሁን ምንም ተግባር የለም"
  },
  "guests": {
    "title": "የእንግዶች ዝርዝር",
    "addGuest": "እንግዳ ጨምር",
    "totalGuests": "{{count}} እንግዶች",
    "attending": "ይመጣሉ",
    "declined": "አልመጣም",
    "pending": "በመጠባበቅ ላይ",
    "name": "የእንግዳ ስም",
    "email": "ኢሜይል",
    "phone": "ስልክ",
    "side": "ጎን",
    "relationship": "ዝምድና",
    "mealChoice": "የምግብ ምርጫ",
    "rsvpStatus": "የምላሽ ሁኔታ",
    "noGuests": "እስካሁን ምንም እንግዳ አልተጨመረም"
  },
  "budget": {
    "title": "በጀት",
    "totalBudget": "ጠቅላላ በጀት",
    "spent": "የወጣ",
    "remaining": "ቀሪ",
    "addExpense": "ወጪ ጨምር",
    "category": "ምድብ",
    "amount": "መጠን",
    "description": "መግለጫ",
    "noExpenses": "ምንም ወጪ አልተመዘገበም"
  },
  "messages": {
    "title": "መልእክቶች",
    "noMessages": "እስካሁን ምንም መልእክት የለም",
    "typeMessage": "መልእክት ይጻፉ...",
    "send": "ላክ",
    "newMessage": "አዲስ መልእክት"
  },
  "profile": {
    "title": "መገለጫ",
    "editProfile": "መገለጫ አርትዕ",
    "settings": "ቅንብሮች",
    "language": "ቋንቋ",
    "english": "English",
    "amharic": "አማርኛ",
    "notifications": "ማሳወቂያዎች",
    "about": "ስለ",
    "version": "ስሪት",
    "logoutConfirm": "መውጣት እንደሚፈልጉ እርግጠኛ ነዎት?"
  },
  "wedding": {
    "setup": "ሰርግዎን ያዘጋጁ",
    "weddingDate": "የሰርግ ቀን",
    "partnerName": "የባለቤት ስም",
    "estimatedGuests": "የሚገመቱ እንግዶች",
    "venue": "ቦታ (አማራጭ)",
    "stylePreferences": "የዘይቤ ምርጫዎች",
    "createWedding": "ሰርግ ፍጠር",
    "countdown": "{{days}} ቀናት ቀሩ!",
    "budgetSpent": "{{percent}}% የበጀት ወጪ",
    "overallProgress": "አጠቃላይ ሂደት"
  },
  "errors": {
    "networkError": "የአውታረ መረብ ስህተት። ግንኙነትዎን ያረጋግጡ።",
    "serverError": "የአገልጋይ ስህተት። እባክዎ ቆይተው ይሞክሩ።",
    "unauthorized": "ክፍለ ጊዜው አልቋል። እባክዎ እንደገና ይግቡ።",
    "forbidden": "ለዚህ ድርጊት ፈቃድ የለዎትም።",
    "notFound": "የተጠየቀው ግብአት አልተገኘም።",
    "rateLimited": "ብዙ ጥያቄዎች። እባክዎ ትንሽ ይጠብቁ።",
    "validationError": "እባክዎ ግብአትዎን ያረጋግጡ እና እንደገና ይሞክሩ።"
  }
}
```

### 41.11 Root Layout

**app/_layout.tsx:**

```typescript
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
            animation: 'slide_from_right',
          }}
        />
      </View>
    </QueryClientProvider>
  );
}
```

### 41.12 Entry Point + Basic Navigation

**app/index.tsx:**

```typescript
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';

export default function Index() {
  const { isAuthenticated } = useAuthStore();
  return <Redirect href={isAuthenticated ? '/(main)' : '/(auth)/login'} />;
}
```

**app/(auth)/_layout.tsx:**

```typescript
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
  );
}
```

**app/(auth)/login.tsx** — Placeholder:

```typescript
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function LoginScreen() {
  const { t } = useTranslation();
  return (
    <View className="flex-1 items-center justify-center bg-surface">
      <Text className="text-2xl font-bold text-content">{t('auth.login')}</Text>
      <Text className="mt-2 text-content-secondary">{t('auth.loginSubtitle')}</Text>
    </View>
  );
}
```

**app/(main)/_layout.tsx:**

```typescript
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export default function MainLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4c6ef5', // Matches brand-600 from tailwind.config.js
        tabBarInactiveTintColor: '#868e96',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#dee2e6',
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

**app/(main)/index.tsx:**

```typescript
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth-store';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  return (
    <View className="flex-1 bg-surface pt-16 px-4">
      <Text className="text-2xl font-bold text-content">
        {t('home.welcome', { name: user?.name || '' })}
      </Text>
    </View>
  );
}
```

**app/(main)/search.tsx:**

```typescript
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function SearchScreen() {
  const { t } = useTranslation();
  return (
    <View className="flex-1 bg-surface pt-16 px-4">
      <Text className="text-2xl font-bold text-content">{t('search.title')}</Text>
    </View>
  );
}
```

**app/(main)/profile.tsx:**

```typescript
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth-store';
import i18n from '@/i18n';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'am' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <View className="flex-1 bg-surface pt-16 px-4">
      <Text className="text-2xl font-bold text-content">{t('profile.title')}</Text>
      <Text className="mt-2 text-content-secondary">{user?.email}</Text>

      <Pressable
        className="mt-6 rounded-button bg-brand-100 px-4 py-3"
        onPress={toggleLanguage}
      >
        <Text className="text-center text-brand-700">
          {t('profile.language')}: {i18n.language === 'en' ? t('profile.english') : t('profile.amharic')}
        </Text>
      </Pressable>

      <Pressable
        className="mt-4 rounded-button bg-danger-50 px-4 py-3"
        onPress={logout}
      >
        <Text className="text-center text-danger-700">{t('auth.logout')}</Text>
      </Pressable>
    </View>
  );
}
```

## Acceptance Criteria
- [ ] `apps/mobile/` directory exists with all files listed above
- [ ] `npm install` succeeds in `apps/mobile/`
- [ ] `expo start --web` launches without errors
- [ ] TypeScript compiles without errors (`npm run typecheck`)
- [ ] NativeWind classes render correctly (bg-surface, text-content, bg-brand-500, etc.)
- [ ] Changing brand colors in `tailwind.config.js` changes all brand-colored elements
- [ ] No hardcoded color values in any `.tsx` file (except tailwind.config.js tab bar reference)
- [ ] i18n works — `t()` renders English text by default
- [ ] Language toggle switches between English and Amharic
- [ ] All user-facing text uses `t()` — no hardcoded English strings in components
- [ ] `lib/api.ts` has Axios client with token refresh interceptor and request queuing
- [ ] `store/auth-store.ts` has Zustand store with SecureStore (web localStorage fallback)
- [ ] `lib/config.ts` has configurable app name and branding
- [ ] Tab navigation renders with Home, Search, Profile tabs
- [ ] Auth redirect works (unauthenticated → login, authenticated → main)
- [ ] `.env.example` documents `EXPO_PUBLIC_API_URL` and branding variables

## Files to Create
- `apps/mobile/package.json`
- `apps/mobile/app.json`
- `apps/mobile/eas.json`
- `apps/mobile/tsconfig.json`
- `apps/mobile/babel.config.js`
- `apps/mobile/metro.config.js`
- `apps/mobile/tailwind.config.js`
- `apps/mobile/global.css`
- `apps/mobile/expo-env.d.ts`
- `apps/mobile/nativewind-env.d.ts`
- `apps/mobile/.env.example`
- `apps/mobile/lib/api.ts`
- `apps/mobile/lib/config.ts`
- `apps/mobile/store/auth-store.ts`
- `apps/mobile/i18n/index.ts`
- `apps/mobile/i18n/en.json`
- `apps/mobile/i18n/am.json`
- `apps/mobile/app/_layout.tsx`
- `apps/mobile/app/index.tsx`
- `apps/mobile/app/(auth)/_layout.tsx`
- `apps/mobile/app/(auth)/login.tsx`
- `apps/mobile/app/(main)/_layout.tsx`
- `apps/mobile/app/(main)/index.tsx`
- `apps/mobile/app/(main)/search.tsx`
- `apps/mobile/app/(main)/profile.tsx`
- `apps/mobile/assets/icon.png` (placeholder)
- `apps/mobile/assets/splash-icon.png` (placeholder)
- `apps/mobile/assets/adaptive-icon.png` (placeholder)
- `apps/mobile/assets/favicon.png` (placeholder)
- `apps/mobile/assets/notification-icon.png` (placeholder)

## Dependencies
- Tasks 01–27 (backend complete)
- No frontend task dependencies — mobile is a parallel track
