# Task 29: Frontend i18n — Internationalization with i18next

## Summary
Set up internationalization (i18n) across all 3 frontend apps using i18next, with English as the primary language and Amharic as a secondary placeholder. All UI strings must come from translation files — no hardcoded strings in components.

## Current State
- All 3 apps have shadcn/ui components and theming from Task 28
- No i18n library installed
- All UI strings are hardcoded in English (minimal strings currently, mostly in placeholder pages)
- No language detection or persistence

## Required Changes

### 29.1 Install Dependencies

Run in each app directory (`apps/web`, `apps/admin`, `apps/provider-portal`):

```bash
npm install i18next react-i18next i18next-browser-languagedetector
```

### 29.2 Create i18n Directory Structure

Create in each app:
```
src/i18n/
├── index.ts          # i18next configuration
├── en.json           # English translations
└── am.json           # Amharic translations (placeholder)
```

### 29.3 i18n Configuration

Create `src/i18n/index.ts` in each app:

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './en.json';
import am from './am.json';

// Storage key differs per app to avoid conflicts
const STORAGE_KEY = 'saas_admin_lang'; // or saas_provider_lang, saas_web_lang

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      am: { translation: am },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: STORAGE_KEY,
      caches: ['localStorage'],
    },
  });

export default i18n;
```

Use these storage keys:
- **admin**: `saas_admin_lang`
- **provider-portal**: `saas_provider_lang`
- **web**: `saas_web_lang`

### 29.4 English Translation Files

**Admin** (`apps/admin/src/i18n/en.json`):
```json
{
  "nav": {
    "dashboard": "Dashboard",
    "tenants": "Tenants",
    "users": "Users",
    "roles": "Roles & Permissions",
    "subscriptions": "Subscriptions",
    "auditLogs": "Audit Logs",
    "jobs": "Jobs & Queues",
    "settings": "Settings"
  },
  "common": {
    "appName": "Directory Admin",
    "search": "Search...",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "view": "View",
    "create": "Create",
    "close": "Close",
    "confirm": "Confirm",
    "back": "Back",
    "next": "Next",
    "loading": "Loading...",
    "noResults": "No results found",
    "showing": "Showing {{from}} to {{to}} of {{total}}",
    "rowsPerPage": "Rows per page",
    "actions": "Actions",
    "status": "Status",
    "active": "Active",
    "inactive": "Inactive",
    "suspended": "Suspended",
    "pending": "Pending",
    "comingSoon": "Coming soon",
    "pageNotFound": "Page not found",
    "goHome": "Go to Dashboard",
    "retry": "Retry",
    "errorOccurred": "An error occurred",
    "language": "Language",
    "theme": "Theme",
    "light": "Light",
    "dark": "Dark",
    "system": "System"
  },
  "auth": {
    "login": "Sign In",
    "logout": "Sign Out",
    "email": "Email",
    "password": "Password",
    "forgotPassword": "Forgot password?",
    "loginTitle": "Admin Login",
    "loginSubtitle": "Sign in to the admin dashboard",
    "invalidCredentials": "Invalid email or password",
    "sessionExpired": "Your session has expired. Please sign in again.",
    "loggingIn": "Signing in..."
  },
  "dashboard": {
    "title": "Dashboard",
    "welcome": "Welcome back, {{name}}",
    "totalTenants": "Total Tenants",
    "activeUsers": "Active Users",
    "activeSubscriptions": "Active Subscriptions",
    "revenue": "Revenue",
    "recentTenants": "Recent Tenants",
    "systemHealth": "System Health"
  },
  "tenants": {
    "title": "Tenants",
    "createTenant": "Create Tenant",
    "editTenant": "Edit Tenant",
    "viewTenant": "Tenant Details",
    "suspendTenant": "Suspend Tenant",
    "name": "Name",
    "slug": "Slug",
    "plan": "Plan",
    "usersCount": "Users",
    "createdAt": "Created",
    "suspendReason": "Reason for suspension",
    "confirmSuspend": "Are you sure you want to suspend this tenant?",
    "ownerEmail": "Owner Email",
    "tenantCreated": "Tenant created successfully",
    "tenantUpdated": "Tenant updated successfully",
    "tenantSuspended": "Tenant suspended"
  },
  "users": {
    "title": "Users",
    "name": "Name",
    "email": "Email",
    "type": "Type",
    "lastLogin": "Last Login",
    "admin": "Admin",
    "tenant": "Tenant User",
    "client": "Client"
  },
  "roles": {
    "title": "Roles & Permissions",
    "createRole": "Create Role",
    "roleName": "Role Name",
    "permissions": "Permissions",
    "assignPermissions": "Assign Permissions",
    "resource": "Resource",
    "action": "Action"
  },
  "subscriptions": {
    "title": "Subscriptions",
    "plan": "Plan",
    "startDate": "Start Date",
    "endDate": "End Date",
    "changePlan": "Change Plan",
    "usage": "Usage"
  },
  "audit": {
    "title": "Audit Logs",
    "timestamp": "Timestamp",
    "user": "User",
    "action": "Action",
    "resource": "Resource",
    "details": "Details"
  },
  "jobs": {
    "title": "Jobs & Queues",
    "queue": "Queue",
    "pending": "Pending",
    "active": "Active",
    "completed": "Completed",
    "failed": "Failed",
    "viewDashboard": "Open Bull Board"
  },
  "settings": {
    "title": "Settings",
    "platform": "Platform Settings",
    "appName": "Application Name",
    "defaultPlan": "Default Plan",
    "systemHealth": "System Health"
  },
  "errors": {
    "required": "This field is required",
    "invalidEmail": "Invalid email address",
    "minLength": "Must be at least {{min}} characters",
    "maxLength": "Must be at most {{max}} characters",
    "networkError": "Network error. Please check your connection.",
    "serverError": "Server error. Please try again later.",
    "unauthorized": "You are not authorized to perform this action",
    "notFound": "The requested resource was not found"
  }
}
```

**Provider Portal** (`apps/provider-portal/src/i18n/en.json`):
```json
{
  "nav": {
    "dashboard": "Dashboard",
    "profile": "Profile",
    "portfolio": "Portfolio",
    "bookings": "Bookings",
    "reviews": "Reviews",
    "calendar": "Calendar",
    "messages": "Messages",
    "team": "Team",
    "analytics": "Analytics",
    "settings": "Settings"
  },
  "common": {
    "appName": "Provider Portal",
    "search": "Search...",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "view": "View",
    "create": "Create",
    "close": "Close",
    "confirm": "Confirm",
    "back": "Back",
    "next": "Next",
    "loading": "Loading...",
    "noResults": "No results found",
    "showing": "Showing {{from}} to {{to}} of {{total}}",
    "rowsPerPage": "Rows per page",
    "actions": "Actions",
    "status": "Status",
    "active": "Active",
    "inactive": "Inactive",
    "pending": "Pending",
    "comingSoon": "Coming soon",
    "pageNotFound": "Page not found",
    "goHome": "Go to Dashboard",
    "retry": "Retry",
    "errorOccurred": "An error occurred",
    "language": "Language",
    "theme": "Theme",
    "light": "Light",
    "dark": "Dark",
    "system": "System"
  },
  "auth": {
    "login": "Sign In",
    "logout": "Sign Out",
    "email": "Email",
    "password": "Password",
    "tenantSlug": "Business ID",
    "loginTitle": "Provider Login",
    "loginSubtitle": "Sign in to manage your business",
    "invalidCredentials": "Invalid email or password",
    "sessionExpired": "Your session has expired. Please sign in again.",
    "loggingIn": "Signing in..."
  },
  "dashboard": {
    "title": "Dashboard",
    "welcome": "Welcome back, {{name}}",
    "totalBookings": "Total Bookings",
    "pendingInquiries": "Pending Inquiries",
    "averageRating": "Average Rating",
    "revenueThisMonth": "Revenue This Month",
    "recentBookings": "Recent Bookings",
    "recentReviews": "Recent Reviews",
    "quickActions": "Quick Actions",
    "updateProfile": "Update Profile",
    "checkMessages": "Check Messages",
    "viewCalendar": "View Calendar"
  },
  "profile": {
    "title": "Profile",
    "generalInfo": "General Info",
    "packages": "Packages & Pricing",
    "faqs": "FAQs",
    "availability": "Availability",
    "businessName": "Business Name",
    "description": "Description",
    "category": "Category",
    "location": "Location",
    "styles": "Styles",
    "languages": "Languages",
    "contactInfo": "Contact Info",
    "phone": "Phone",
    "website": "Website",
    "saved": "Profile saved successfully"
  },
  "portfolio": {
    "title": "Portfolio",
    "addItem": "Add Item",
    "uploadFiles": "Upload Files",
    "dragDrop": "Drag and drop files here, or click to browse",
    "itemTitle": "Title",
    "itemDescription": "Description",
    "setCover": "Set as Cover",
    "deleteItem": "Delete Item"
  },
  "bookings": {
    "title": "Bookings",
    "all": "All",
    "inquiries": "Inquiries",
    "active": "Active",
    "completed": "Completed",
    "cancelled": "Cancelled",
    "coupleName": "Couple",
    "eventDate": "Event Date",
    "package": "Package",
    "amount": "Amount",
    "respondToInquiry": "Respond",
    "sendQuote": "Send Quote",
    "updateStatus": "Update Status"
  },
  "reviews": {
    "title": "Reviews",
    "averageRating": "Average Rating",
    "totalReviews": "Total Reviews",
    "respond": "Respond",
    "yourResponse": "Your Response"
  },
  "team": {
    "title": "Team",
    "inviteMember": "Invite Member",
    "role": "Role",
    "email": "Email",
    "joined": "Joined",
    "removeMember": "Remove Member"
  },
  "messages": {
    "title": "Messages",
    "newMessage": "New Message",
    "typeMessage": "Type a message...",
    "send": "Send",
    "noMessages": "No messages yet"
  },
  "calendar": {
    "title": "Calendar",
    "available": "Available",
    "booked": "Booked",
    "blocked": "Blocked",
    "blockDates": "Block Dates"
  },
  "analytics": {
    "title": "Analytics",
    "profileViews": "Profile Views",
    "inquiries": "Inquiries",
    "bookingRate": "Booking Rate",
    "revenue": "Revenue"
  },
  "settings": {
    "title": "Settings",
    "notifications": "Notifications",
    "businessHours": "Business Hours",
    "autoReply": "Auto-Reply",
    "account": "Account"
  },
  "errors": {
    "required": "This field is required",
    "invalidEmail": "Invalid email address",
    "minLength": "Must be at least {{min}} characters",
    "maxLength": "Must be at most {{max}} characters",
    "networkError": "Network error. Please check your connection.",
    "serverError": "Server error. Please try again later.",
    "unauthorized": "You are not authorized to perform this action",
    "notFound": "The requested resource was not found"
  }
}
```

**Web App** (`apps/web/src/i18n/en.json`):
```json
{
  "nav": {
    "home": "Home",
    "search": "Search",
    "categories": "Categories",
    "howItWorks": "How It Works",
    "login": "Login",
    "signUp": "Sign Up",
    "dashboard": "Dashboard",
    "myWedding": "My Wedding",
    "guestList": "Guest List",
    "budget": "Budget",
    "checklist": "Checklist",
    "vendors": "My Vendors",
    "messages": "Messages",
    "settings": "Settings"
  },
  "common": {
    "appName": "Directory SaaS",
    "search": "Search...",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "view": "View",
    "create": "Create",
    "close": "Close",
    "confirm": "Confirm",
    "back": "Back",
    "next": "Next",
    "loading": "Loading...",
    "noResults": "No results found",
    "showing": "Showing {{from}} to {{to}} of {{total}}",
    "rowsPerPage": "Rows per page",
    "actions": "Actions",
    "viewAll": "View All",
    "learnMore": "Learn More",
    "getStarted": "Get Started",
    "comingSoon": "Coming soon",
    "pageNotFound": "Page not found",
    "goHome": "Go to Home",
    "retry": "Retry",
    "errorOccurred": "An error occurred",
    "language": "Language",
    "theme": "Theme",
    "light": "Light",
    "dark": "Dark",
    "system": "System"
  },
  "auth": {
    "login": "Sign In",
    "logout": "Sign Out",
    "register": "Create Account",
    "email": "Email",
    "password": "Password",
    "confirmPassword": "Confirm Password",
    "name": "Full Name",
    "loginTitle": "Welcome Back",
    "loginSubtitle": "Sign in to your account",
    "registerTitle": "Create Your Account",
    "registerSubtitle": "Start planning your perfect event",
    "invalidCredentials": "Invalid email or password",
    "passwordMismatch": "Passwords do not match",
    "hasAccount": "Already have an account?",
    "noAccount": "Don't have an account?",
    "loggingIn": "Signing in...",
    "registering": "Creating account..."
  },
  "landing": {
    "heroTitle": "Find the Perfect Vendors for Your Event",
    "heroSubtitle": "Browse thousands of trusted professionals, compare packages, and book with confidence",
    "searchPlaceholder": "What are you looking for?",
    "searchCategory": "Category",
    "searchLocation": "Location",
    "searchDate": "Date",
    "searchButton": "Search",
    "featuredVendors": "Featured Vendors",
    "howItWorksTitle": "How It Works",
    "step1Title": "Search",
    "step1Description": "Browse vendors by category, location, and budget",
    "step2Title": "Compare",
    "step2Description": "View portfolios, read reviews, and compare packages",
    "step3Title": "Book",
    "step3Description": "Send inquiries and book your favorite vendors",
    "categoriesTitle": "Browse by Category",
    "testimonialsTitle": "What Our Clients Say",
    "ctaTitle": "Ready to Start Planning?",
    "ctaSubtitle": "Join thousands of happy couples who found their perfect vendors",
    "ctaButton": "Get Started Free"
  },
  "search": {
    "title": "Find Vendors",
    "filters": "Filters",
    "category": "Category",
    "budget": "Budget Range",
    "rating": "Minimum Rating",
    "style": "Style",
    "languages": "Languages",
    "distance": "Distance",
    "sortBy": "Sort by",
    "recommended": "Recommended",
    "ratingHighLow": "Rating: High to Low",
    "priceLowHigh": "Price: Low to High",
    "priceHighLow": "Price: High to Low",
    "mostReviewed": "Most Reviewed",
    "results": "{{count}} results",
    "noResults": "No vendors found matching your criteria",
    "clearFilters": "Clear Filters",
    "startingFrom": "From {{price}}",
    "viewProfile": "View Profile",
    "mapView": "Map View",
    "listView": "List View"
  },
  "vendor": {
    "about": "About",
    "portfolio": "Portfolio",
    "packages": "Packages",
    "reviews": "Reviews",
    "faq": "FAQ",
    "requestQuote": "Request a Quote",
    "startingFrom": "Starting from",
    "perEvent": "per event",
    "includes": "Includes",
    "reviewCount": "{{count}} reviews",
    "responseTime": "Response time",
    "inquiryForm": "Send Inquiry",
    "eventDate": "Event Date",
    "guestCount": "Guest Count",
    "budgetRange": "Budget Range",
    "message": "Message",
    "sendInquiry": "Send Inquiry",
    "inquirySent": "Inquiry sent! The vendor will respond shortly."
  },
  "dashboard": {
    "title": "Dashboard",
    "welcome": "Welcome, {{name}}",
    "weddingOverview": "Wedding Overview",
    "countdown": "{{days}} days to go!",
    "vendorsBooked": "Vendors Booked",
    "guestsConfirmed": "Guests Confirmed",
    "budgetSpent": "Budget Spent",
    "tasksDone": "Tasks Done",
    "upcomingTasks": "Upcoming Tasks",
    "recentMessages": "Recent Messages"
  },
  "wedding": {
    "title": "My Wedding",
    "weddingDate": "Wedding Date",
    "estimatedGuests": "Estimated Guests",
    "venue": "Venue",
    "style": "Style Preferences",
    "events": "Events",
    "collaborators": "Collaborators"
  },
  "guestList": {
    "title": "Guest List",
    "addGuest": "Add Guest",
    "importCsv": "Import CSV",
    "name": "Name",
    "group": "Group",
    "side": "Side",
    "events": "Events",
    "rsvp": "RSVP",
    "meal": "Meal Choice",
    "attending": "Attending",
    "declined": "Declined",
    "pending": "Pending",
    "summary": "RSVP Summary"
  },
  "budget": {
    "title": "Budget",
    "totalBudget": "Total Budget",
    "spent": "Spent",
    "remaining": "Remaining",
    "addItem": "Add Budget Item",
    "category": "Category",
    "estimated": "Estimated",
    "actual": "Actual",
    "paid": "Paid",
    "balance": "Balance"
  },
  "checklist": {
    "title": "Checklist",
    "addTask": "Add Task",
    "dueDate": "Due Date",
    "assignedTo": "Assigned To",
    "all": "All",
    "overdue": "Overdue",
    "upcoming": "Upcoming",
    "completed": "Completed",
    "progress": "{{done}} of {{total}} complete"
  },
  "messages": {
    "title": "Messages",
    "newMessage": "New Message",
    "typeMessage": "Type a message...",
    "send": "Send",
    "noMessages": "No messages yet"
  },
  "settings": {
    "title": "Settings",
    "account": "Account",
    "notifications": "Notifications",
    "weddingWebsite": "Wedding Website"
  },
  "errors": {
    "required": "This field is required",
    "invalidEmail": "Invalid email address",
    "minLength": "Must be at least {{min}} characters",
    "maxLength": "Must be at most {{max}} characters",
    "networkError": "Network error. Please check your connection.",
    "serverError": "Server error. Please try again later.",
    "unauthorized": "You are not authorized to perform this action",
    "notFound": "The requested resource was not found"
  }
}
```

### 29.5 Amharic Translation Files

Create `am.json` for each app. Provide real Amharic translations for the most common UI elements. Example for admin (`apps/admin/src/i18n/am.json`):

```json
{
  "nav": {
    "dashboard": "ዳሽቦርድ",
    "tenants": "ተከራዮች",
    "users": "ተጠቃሚዎች",
    "roles": "ሚናዎች እና ፈቃዶች",
    "subscriptions": "ምዝገባዎች",
    "auditLogs": "የኦዲት ምዝግብ",
    "jobs": "ስራዎች",
    "settings": "ቅንብሮች"
  },
  "common": {
    "appName": "ዳይሬክቶሪ አስተዳዳሪ",
    "search": "ፈልግ...",
    "save": "አስቀምጥ",
    "cancel": "ሰርዝ",
    "delete": "ሰርዝ",
    "edit": "አርትዕ",
    "view": "ዝርዝር",
    "create": "ፍጠር",
    "close": "ዝጋ",
    "confirm": "አረጋግጥ",
    "back": "ተመለስ",
    "next": "ቀጣይ",
    "loading": "በመጫን ላይ...",
    "noResults": "ውጤት አልተገኘም",
    "showing": "{{from}} እስከ {{to}} ከ {{total}} በማሳየት ላይ",
    "rowsPerPage": "ረድፎች በገጽ",
    "actions": "ድርጊቶች",
    "status": "ሁኔታ",
    "active": "ንቁ",
    "inactive": "ቦዘን",
    "suspended": "የታገደ",
    "pending": "በመጠባበቅ ላይ",
    "comingSoon": "በቅርቡ ይመጣል",
    "pageNotFound": "ገጹ አልተገኘም",
    "goHome": "ወደ ዳሽቦርድ ሂድ",
    "retry": "እንደገና ሞክር",
    "errorOccurred": "ስህተት ተፈጥሯል",
    "language": "ቋንቋ",
    "theme": "ገጽታ",
    "light": "ብሩህ",
    "dark": "ጨለማ",
    "system": "ስርዓት"
  },
  "auth": {
    "login": "ግባ",
    "logout": "ውጣ",
    "email": "ኢሜል",
    "password": "የይለፍ ቃል",
    "forgotPassword": "የይለፍ ቃል ረሱ?",
    "loginTitle": "የአስተዳዳሪ መግቢያ",
    "loginSubtitle": "ወደ አስተዳዳሪ ዳሽቦርድ ይግቡ",
    "invalidCredentials": "ልክ ያልሆነ ኢሜል ወይም የይለፍ ቃል",
    "sessionExpired": "ክፍለ ጊዜዎ አልቋል። እባክዎ እንደገና ይግቡ።",
    "loggingIn": "በመግባት ላይ..."
  },
  "dashboard": {
    "title": "ዳሽቦርድ",
    "welcome": "እንኳን ደህና መጡ {{name}}",
    "totalTenants": "ጠቅላላ ተከራዮች",
    "activeUsers": "ንቁ ተጠቃሚዎች",
    "activeSubscriptions": "ንቁ ምዝገባዎች",
    "revenue": "ገቢ",
    "recentTenants": "የቅርብ ተከራዮች",
    "systemHealth": "የስርዓት ጤና"
  },
  "errors": {
    "required": "ይህ መስክ ያስፈልጋል",
    "invalidEmail": "ልክ ያልሆነ ኢሜል አድራሻ",
    "minLength": "ቢያንስ {{min}} ቁምፊዎች መሆን አለበት",
    "maxLength": "ቢበዛ {{max}} ቁምፊዎች መሆን አለበት",
    "networkError": "የኔትወርክ ስህተት። እባክዎ ግንኙነትዎን ያረጋግጡ።",
    "serverError": "የሰርቨር ስህተት። እባክዎ ቆየት ብለው ይሞክሩ።",
    "unauthorized": "ይህን ድርጊት ለማከናወን ፈቃድ የለዎትም",
    "notFound": "የተጠየቀው ሀብት አልተገኘም"
  }
}
```

Create similar Amharic files for provider-portal and web apps. Translate the `nav`, `common`, `auth`, `errors` namespaces fully. Other namespaces can have placeholder text that mirrors the English keys with "TODO:" prefix (e.g., `"title": "TODO: Dashboard"`).

### 29.6 LanguageSwitcher Component

Create `src/components/language-switcher.tsx` in each app:

```typescript
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ' },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Globe className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => i18n.changeLanguage(lang.code)}
            className={i18n.language === lang.code ? 'bg-accent' : ''}
          >
            <span>{lang.nativeName}</span>
            {lang.code !== lang.nativeName && (
              <span className="ml-2 text-muted-foreground text-xs">({lang.name})</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### 29.7 Import i18n in main.tsx

Update `src/main.tsx` in each app to import the i18n config:

```typescript
// Add this import BEFORE App import
import './i18n';
```

This must be imported early so i18next is initialized before any component renders.

### 29.8 Usage Pattern in Components

All components should use the `useTranslation` hook:

```typescript
import { useTranslation } from 'react-i18next';

export function SomeComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <p>{t('dashboard.welcome', { name: 'John' })}</p>
      <button>{t('common.save')}</button>
    </div>
  );
}
```

**Never hardcode UI strings.** Every user-visible string must come from a translation key.

## Acceptance Criteria
- [ ] `i18next`, `react-i18next`, `i18next-browser-languagedetector` installed in all 3 apps
- [ ] `src/i18n/index.ts` configured with language detection (localStorage > navigator) in all 3 apps
- [ ] `src/i18n/en.json` exists with comprehensive English translations for all nav, common, auth, dashboard, and feature-specific strings in all 3 apps
- [ ] `src/i18n/am.json` exists with Amharic translations (at minimum: nav, common, auth, errors fully translated) in all 3 apps
- [ ] `LanguageSwitcher` component renders globe icon dropdown with English and Amharic options in all 3 apps
- [ ] Language selection persists to localStorage with app-specific keys (`saas_admin_lang`, `saas_provider_lang`, `saas_web_lang`)
- [ ] Switching to Amharic shows Ge'ez script strings
- [ ] i18n is imported in `main.tsx` before App component in all 3 apps
- [ ] All 3 apps build with 0 errors

## Files to Create/Modify
- `apps/admin/src/i18n/index.ts` (create)
- `apps/admin/src/i18n/en.json` (create)
- `apps/admin/src/i18n/am.json` (create)
- `apps/admin/src/components/language-switcher.tsx` (create)
- `apps/admin/src/main.tsx` (modify — add i18n import)
- Same files for `apps/provider-portal/` and `apps/web/`

## Dependencies
- Task 28 (Frontend Shared Foundation) — shadcn/ui components (Button, DropdownMenu) must exist
