# Task 28: Frontend Shared Foundation — shadcn/ui, Theming, Utilities

## Summary
Set up the component library (shadcn/ui), OKLch theming system, and shared utilities across all 3 frontend apps (admin, provider-portal, web). This establishes the design system foundation that every subsequent frontend task depends on.

## Current State
- All 3 apps exist as empty shells: Vite 7 + React 19 + TypeScript + Tailwind CSS 4 + basic axios API client
- Each app has: `src/App.tsx`, `src/main.tsx`, `src/index.css` (just `@import "tailwindcss"`), `src/lib/api.ts`, `src/lib/types.ts`
- No UI component library, no theming, no dark mode, no shared utilities
- Tailwind CSS 4 is configured via `@tailwindcss/vite` plugin in `vite.config.ts`
- Each app already has `react`, `react-dom`, `react-router`, `@tanstack/react-query`, `zustand`, `zod`, `axios` installed

## Required Changes

### 28.1 Install Dependencies

Run in each app directory (`apps/web`, `apps/admin`, `apps/provider-portal`):

```bash
npm install class-variance-authority tailwind-merge clsx lucide-react sonner
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-sheet @radix-ui/react-tooltip @radix-ui/react-avatar @radix-ui/react-tabs @radix-ui/react-select @radix-ui/react-popover @radix-ui/react-accordion @radix-ui/react-alert-dialog @radix-ui/react-checkbox @radix-ui/react-radio-group @radix-ui/react-switch @radix-ui/react-scroll-area @radix-ui/react-separator @radix-ui/react-label @radix-ui/react-progress @radix-ui/react-slot @radix-ui/react-toggle @radix-ui/react-toggle-group @radix-ui/react-collapsible
```

Also add path alias support. In each app's `tsconfig.json` (or `tsconfig.app.json`), add:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

In each app's `vite.config.ts`, add the path alias:
```typescript
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // ... existing config
});
```

### 28.2 Create cn() Utility

Create `src/lib/utils.ts` in each app:

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 28.3 OKLch Theme System — CSS Variables

Replace `src/index.css` in each app with the full theme system. The key insight is a single `--brand-hue` CSS variable that rebrands the entire app:

```css
@import "tailwindcss";

/*
 * OKLch Branding System
 * Change --brand-hue to rebrand the entire app.
 * Hue values: 0=red, 30=orange, 60=yellow, 140=green, 230=blue, 270=purple, 330=pink
 */

:root {
  --brand-hue: 230;

  /* Light mode colors using oklch */
  --background: oklch(0.99 0.005 var(--brand-hue));
  --foreground: oklch(0.15 0.02 var(--brand-hue));

  --card: oklch(1 0 0);
  --card-foreground: oklch(0.15 0.02 var(--brand-hue));

  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.15 0.02 var(--brand-hue));

  --primary: oklch(0.55 0.18 var(--brand-hue));
  --primary-foreground: oklch(0.98 0.01 var(--brand-hue));

  --secondary: oklch(0.93 0.03 var(--brand-hue));
  --secondary-foreground: oklch(0.25 0.05 var(--brand-hue));

  --muted: oklch(0.95 0.02 var(--brand-hue));
  --muted-foreground: oklch(0.5 0.03 var(--brand-hue));

  --accent: oklch(0.93 0.03 var(--brand-hue));
  --accent-foreground: oklch(0.25 0.05 var(--brand-hue));

  --destructive: oklch(0.55 0.2 25);
  --destructive-foreground: oklch(0.98 0.01 25);

  --border: oklch(0.88 0.02 var(--brand-hue));
  --input: oklch(0.88 0.02 var(--brand-hue));
  --ring: oklch(0.55 0.18 var(--brand-hue));

  --radius: 0.5rem;

  --sidebar-background: oklch(0.97 0.01 var(--brand-hue));
  --sidebar-foreground: oklch(0.25 0.03 var(--brand-hue));
  --sidebar-border: oklch(0.90 0.02 var(--brand-hue));
  --sidebar-accent: oklch(0.93 0.03 var(--brand-hue));
  --sidebar-accent-foreground: oklch(0.25 0.05 var(--brand-hue));
  --sidebar-ring: oklch(0.55 0.18 var(--brand-hue));

  --chart-1: oklch(0.55 0.18 var(--brand-hue));
  --chart-2: oklch(0.65 0.15 calc(var(--brand-hue) + 30));
  --chart-3: oklch(0.55 0.15 calc(var(--brand-hue) + 60));
  --chart-4: oklch(0.65 0.12 calc(var(--brand-hue) + 90));
  --chart-5: oklch(0.55 0.12 calc(var(--brand-hue) + 120));
}

.dark {
  --background: oklch(0.13 0.02 var(--brand-hue));
  --foreground: oklch(0.93 0.01 var(--brand-hue));

  --card: oklch(0.17 0.02 var(--brand-hue));
  --card-foreground: oklch(0.93 0.01 var(--brand-hue));

  --popover: oklch(0.17 0.02 var(--brand-hue));
  --popover-foreground: oklch(0.93 0.01 var(--brand-hue));

  --primary: oklch(0.65 0.18 var(--brand-hue));
  --primary-foreground: oklch(0.13 0.03 var(--brand-hue));

  --secondary: oklch(0.22 0.03 var(--brand-hue));
  --secondary-foreground: oklch(0.88 0.02 var(--brand-hue));

  --muted: oklch(0.22 0.03 var(--brand-hue));
  --muted-foreground: oklch(0.6 0.03 var(--brand-hue));

  --accent: oklch(0.22 0.03 var(--brand-hue));
  --accent-foreground: oklch(0.88 0.02 var(--brand-hue));

  --destructive: oklch(0.55 0.2 25);
  --destructive-foreground: oklch(0.98 0.01 25);

  --border: oklch(0.28 0.03 var(--brand-hue));
  --input: oklch(0.28 0.03 var(--brand-hue));
  --ring: oklch(0.65 0.18 var(--brand-hue));

  --sidebar-background: oklch(0.15 0.02 var(--brand-hue));
  --sidebar-foreground: oklch(0.88 0.02 var(--brand-hue));
  --sidebar-border: oklch(0.25 0.03 var(--brand-hue));
  --sidebar-accent: oklch(0.22 0.04 var(--brand-hue));
  --sidebar-accent-foreground: oklch(0.88 0.02 var(--brand-hue));
  --sidebar-ring: oklch(0.65 0.18 var(--brand-hue));

  --chart-1: oklch(0.65 0.18 var(--brand-hue));
  --chart-2: oklch(0.7 0.15 calc(var(--brand-hue) + 30));
  --chart-3: oklch(0.65 0.15 calc(var(--brand-hue) + 60));
  --chart-4: oklch(0.7 0.12 calc(var(--brand-hue) + 90));
  --chart-5: oklch(0.65 0.12 calc(var(--brand-hue) + 120));
}

/* Tailwind CSS 4 theme mapping */
@theme {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-sidebar-background: var(--sidebar-background);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

/* Base styles */
* {
  @apply border-border;
}

body {
  @apply bg-background text-foreground;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

### 28.4 Branding Configuration

Create `src/lib/branding.ts` in each app:

```typescript
export interface BrandConfig {
  name: string;
  shortName: string;
  hue: number;
  description: string;
}

// Default brand — override per deployment via environment variables
export const brand: BrandConfig = {
  name: import.meta.env.VITE_BRAND_NAME || 'Directory SaaS',
  shortName: import.meta.env.VITE_BRAND_SHORT_NAME || 'DS',
  hue: Number(import.meta.env.VITE_BRAND_HUE) || 230,
  description: import.meta.env.VITE_BRAND_DESCRIPTION || 'Directory & Marketplace Platform',
};

/**
 * Apply brand hue to the document root CSS variable.
 * Call once on app startup in main.tsx.
 */
export function applyBrandHue(hue?: number) {
  const root = document.documentElement;
  root.style.setProperty('--brand-hue', String(hue ?? brand.hue));
}
```

Each app should have slightly different defaults:
- **admin**: `name: 'Directory Admin'`, `shortName: 'DA'`
- **provider-portal**: `name: 'Provider Portal'`, `shortName: 'PP'`
- **web**: `name: 'Directory SaaS'`, `shortName: 'DS'`

### 28.5 Theme Hook

Create `src/hooks/use-theme.ts` in each app:

```typescript
import { useCallback, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'saas_theme'; // same key across all apps

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  const resolved = theme === 'system' ? getSystemTheme() : theme;
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(resolved);
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    return stored ?? 'system';
  });

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
    applyTheme(newTheme);
  }, []);

  // Apply on mount and listen for system changes
  useEffect(() => {
    applyTheme(theme);

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (theme === 'system') applyTheme('system');
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [theme]);

  const resolvedTheme = theme === 'system' ? getSystemTheme() : theme;

  return { theme, setTheme, resolvedTheme };
}
```

### 28.6 shadcn/ui Components

Create `src/components/ui/` directory in each app. Create ALL of the following component files. Each follows the standard shadcn/ui pattern — using Radix primitives, `cn()` utility, and `class-variance-authority` for variants.

Directory structure for each app:
```
src/components/ui/
├── accordion.tsx
├── alert-dialog.tsx
├── avatar.tsx
├── badge.tsx
├── button.tsx
├── card.tsx
├── checkbox.tsx
├── collapsible.tsx
├── command.tsx
├── dialog.tsx
├── dropdown-menu.tsx
├── input.tsx
├── label.tsx
├── popover.tsx
├── progress.tsx
├── radio-group.tsx
├── scroll-area.tsx
├── select.tsx
├── separator.tsx
├── sheet.tsx
├── skeleton.tsx
├── sonner.tsx
├── switch.tsx
├── table.tsx
├── tabs.tsx
├── textarea.tsx
├── toggle.tsx
├── toggle-group.tsx
└── tooltip.tsx
```

**IMPORTANT**: Use the standard shadcn/ui component implementations. Each component must:
- Import from `@/lib/utils` for `cn()`
- Use `React.forwardRef` where appropriate
- Use `cva` from `class-variance-authority` for variant-based styling (e.g., Button)
- Use `@radix-ui/*` primitives as the base
- Use the CSS variable color tokens (e.g., `bg-primary`, `text-foreground`, `border-border`)

Key component patterns:

**Button** (`button.tsx`):
```typescript
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline: 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

**Card** (`card.tsx`):
```typescript
import * as React from 'react';
import { cn } from '@/lib/utils';

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('rounded-xl border bg-card text-card-foreground shadow', className)} {...props} />
  ),
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  ),
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('font-semibold leading-none tracking-tight', className)} {...props} />
  ),
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  ),
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  ),
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  ),
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
```

**Input** (`input.tsx`):
```typescript
import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
```

Follow the same shadcn/ui pattern for ALL other components listed above. Use the latest shadcn/ui source code patterns. Each Radix-based component wraps the Radix primitive with tailwind classes using the theme CSS variables.

**Sonner** (`sonner.tsx`):
```typescript
import { useTheme } from '@/hooks/use-theme';
import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      theme={resolvedTheme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
```

### 28.7 ThemeToggle Component

Create `src/components/theme-toggle.tsx` in each app:

```typescript
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/hooks/use-theme';

export function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>Light</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>Dark</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>System</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### 28.8 Update main.tsx

Update `src/main.tsx` in each app to apply branding on startup and add the Sonner toaster:

```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
import { Toaster } from '@/components/ui/sonner';
import { applyBrandHue } from '@/lib/branding';
import App from './App';
import './index.css';

// Apply brand hue on startup
applyBrandHue();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster position="top-right" richColors closeButton />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
```

### 28.9 Verify All Apps Build

After all changes, run in each app directory:
```bash
cd apps/web && npm run build
cd apps/admin && npm run build
cd apps/provider-portal && npm run build
```

All three must build with 0 errors.

## Acceptance Criteria
- [ ] All 3 apps have `class-variance-authority`, `tailwind-merge`, `clsx`, `lucide-react`, `sonner`, and all `@radix-ui/*` packages installed
- [ ] `cn()` utility exists at `src/lib/utils.ts` in all 3 apps
- [ ] `src/index.css` has full OKLch theme with `--brand-hue` variable, light/dark modes, and `@theme` block for Tailwind CSS 4
- [ ] `src/lib/branding.ts` exists with `brand` config and `applyBrandHue()` function in all 3 apps
- [ ] `src/hooks/use-theme.ts` exists with `useTheme()` hook (localStorage persistence, system detection) in all 3 apps
- [ ] All 27 shadcn/ui component files exist in `src/components/ui/` in all 3 apps
- [ ] `ThemeToggle` component exists and toggles light/dark/system mode
- [ ] `main.tsx` calls `applyBrandHue()` on startup and renders `<Toaster />`
- [ ] Path alias `@/*` resolves to `./src/*` in tsconfig and vite config
- [ ] All 3 apps build with 0 TypeScript errors
- [ ] Dark mode toggle correctly adds/removes `.dark` class on `<html>` element
- [ ] Changing `--brand-hue` CSS variable rebrands all colors

## Files to Create/Modify
- `apps/web/src/lib/utils.ts` (create)
- `apps/web/src/lib/branding.ts` (create)
- `apps/web/src/hooks/use-theme.ts` (create)
- `apps/web/src/components/ui/*.tsx` (create — 27 component files)
- `apps/web/src/components/theme-toggle.tsx` (create)
- `apps/web/src/index.css` (replace)
- `apps/web/src/main.tsx` (modify)
- `apps/web/vite.config.ts` (modify — add path alias)
- `apps/web/tsconfig.json` or `tsconfig.app.json` (modify — add paths)
- Same files for `apps/admin/` and `apps/provider-portal/`
- `apps/web/package.json` (modified by npm install)
- `apps/admin/package.json` (modified by npm install)
- `apps/provider-portal/package.json` (modified by npm install)

## Dependencies
- Task 01 (Project Scaffolding) — apps must exist with Vite + React + Tailwind CSS 4
