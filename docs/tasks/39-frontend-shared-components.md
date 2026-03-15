# Task 39: Frontend Data Table, Form Components & Shared Hooks

## Summary
Consolidate and enhance the reusable components and hooks that are duplicated across all 3 apps. Build proper shared form components, utility hooks, error boundary, and 404 page. This task refactors the copy-pasted data table into a properly structured component and adds missing shared utilities.

## Current State
- Data table component was copy-pasted into each app (admin, provider-portal, web) during Tasks 32, 36, 38
- Status badge was similarly duplicated
- No form wrapper components, no error boundary, no 404 page
- No shared hooks for debounce, pagination, query params, media query, localStorage
- Each app independently manages URL query params for filters

## Required Changes

### 39.1 Consolidate Data Table Components

Ensure all 3 apps have the identical, latest version of the data table component suite. Update each app's `src/components/data-table/` directory:

```
src/components/data-table/
├── data-table.tsx              # Main table with @tanstack/react-table
├── data-table-pagination.tsx   # Page size selector, navigation
├── data-table-toolbar.tsx      # Search, filters, column visibility
├── data-table-row-actions.tsx  # 3-dot dropdown per row
├── data-table-column-header.tsx # Sortable column headers
└── index.ts                    # Barrel export
```

Ensure @tanstack/react-table is installed in all 3 apps:
```bash
cd apps/web && npm install @tanstack/react-table
cd apps/admin && npm install @tanstack/react-table
cd apps/provider-portal && npm install @tanstack/react-table
```

**Enhanced data-table.tsx** — must support:
1. Server-side pagination (manualPagination + pageCount)
2. Server-side sorting (manualSorting + onSortingChange callback)
3. Server-side filtering (filters passed as URL query params)
4. Row selection with checkboxes (optional, controlled via `enableRowSelection` prop)
5. Loading skeleton state (shows Skeleton rows when `isLoading=true`)
6. Empty state (shows centered "No results" message with optional custom component)
7. Column visibility toggle

```typescript
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  // Pagination
  pageCount?: number;
  page?: number;
  pageSize?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  // Sorting
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  // Selection
  enableRowSelection?: boolean;
  onSelectionChange?: (selectedRows: TData[]) => void;
  // State
  isLoading?: boolean;
  emptyState?: React.ReactNode;
}
```

**Enhanced data-table-toolbar.tsx** — must support:
- Search input with clear button and configurable placeholder
- Multiple filter dropdowns (array of filter configs)
- Column visibility dropdown (toggle which columns are shown)
- Bulk action buttons (shown when rows are selected)
- "Clear all filters" button

```typescript
interface DataTableToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: Array<{
    key: string;
    label: string;
    options: Array<{ label: string; value: string }>;
    value: string;
    onChange: (value: string) => void;
  }>;
  bulkActions?: Array<{
    label: string;
    onClick: () => void;
    icon?: React.ComponentType<{ className?: string }>;
    variant?: 'default' | 'destructive';
  }>;
  selectedCount?: number;
  table?: ReactTable<any>; // For column visibility
}
```

### 39.2 Form Components

Create the following form components in `src/components/form/` in each app:

**FormField** (`form-field.tsx`) — Wraps label + input + error message:

```typescript
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  description?: string;
  className?: string;
  children: React.ReactNode;
}

export function FormField({ label, error, required, description, className, children }: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label className={cn(error && 'text-destructive')}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {children}
      {description && !error && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
```

**FormSection** (`form-section.tsx`) — Card-based form section:

```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}
```

**SearchInput** (`search-input.tsx`) — Input with debounce and clear:

```typescript
import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder, debounceMs = 300, className }: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => onChange(localValue), debounceMs);
    return () => clearTimeout(timer);
  }, [localValue, debounceMs]);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder ?? 'Search...'}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className="pl-8 pr-8"
      />
      {localValue && (
        <Button variant="ghost" size="icon" className="absolute right-1 top-1 h-7 w-7"
          onClick={() => { setLocalValue(''); onChange(''); }}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
```

**DatePicker** (`date-picker.tsx`) — Popover with calendar:

```typescript
import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}

// Simple date picker using a native date input inside a styled popover
// For a full calendar grid component, use a dedicated calendar library
export function DatePicker({ value, onChange, placeholder = 'Pick a date', className }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn('w-full justify-start text-left font-normal', !value && 'text-muted-foreground', className)}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, 'PPP') : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <input
          type="date"
          value={value ? format(value, 'yyyy-MM-dd') : ''}
          onChange={(e) => onChange(e.target.value ? new Date(e.target.value) : undefined)}
          className="border rounded-md p-2 text-sm"
        />
      </PopoverContent>
    </Popover>
  );
}
```

**FileUpload** (`file-upload.tsx`) — Drag & drop zone:

```typescript
import { useRef, useState, useCallback } from 'react';
import { Upload, X, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  accept?: string; // e.g., "image/*,video/mp4"
  multiple?: boolean;
  maxSizeMB?: number;
  onFilesSelected: (files: File[]) => void;
  uploading?: boolean;
  progress?: number; // 0-100
  className?: string;
}

export function FileUpload({ accept, multiple, maxSizeMB = 10, onFilesSelected, uploading, progress, className }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    onFilesSelected(files);
  }, [onFilesSelected]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
        isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
        uploading && 'pointer-events-none opacity-60',
        className,
      )}
    >
      <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
      <p className="mt-2 text-sm font-medium">Drag and drop files here, or click to browse</p>
      <p className="mt-1 text-xs text-muted-foreground">Max file size: {maxSizeMB}MB</p>
      {uploading && progress !== undefined && (
        <Progress value={progress} className="mt-4" />
      )}
      <input ref={inputRef} type="file" multiple={multiple} accept={accept} className="hidden"
        onChange={(e) => onFilesSelected(Array.from(e.target.files ?? []))} />
    </div>
  );
}
```

**ConfirmDialog** (`confirm-dialog.tsx`) — Reusable confirmation:

```typescript
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: 'default' | 'destructive';
  isLoading?: boolean;
}

export function ConfirmDialog({
  open, onOpenChange, title, description, confirmLabel = 'Confirm',
  cancelLabel = 'Cancel', onConfirm, variant = 'default', isLoading,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
          >
            {isLoading ? 'Loading...' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

**StatusBadge** (`status-badge.tsx`) — already exists, ensure consistent across apps:
Already created in Task 32. Ensure identical version in all 3 apps.

**EmptyState** (`empty-state.tsx`):

```typescript
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon = FileQuestion, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="h-12 w-12 text-muted-foreground/50" />
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      {description && <p className="mt-2 text-sm text-muted-foreground max-w-sm">{description}</p>}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-4">{actionLabel}</Button>
      )}
    </div>
  );
}
```

**LoadingSpinner** (`loading-spinner.tsx`):

```typescript
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div className={cn('animate-spin rounded-full border-2 border-primary border-t-transparent', sizeClasses[size], className)} />
  );
}
```

**PageHeader** (`page-header.tsx`):

```typescript
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function PageHeader({ title, description, actions, breadcrumbs }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        {breadcrumbs && (
          <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span>/</span>}
                {crumb.href ? (
                  <Link to={crumb.href} className="hover:text-foreground">{crumb.label}</Link>
                ) : (
                  <span>{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
```

**StatCard** (`stat-card.tsx`):

```typescript
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: { value: number; label: string };
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}

export function StatCard({ label, value, icon: Icon, trend, variant = 'default' }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold">{value}</span>
          {trend && (
            <span className={cn(
              'text-xs font-medium',
              trend.value >= 0 ? 'text-green-600' : 'text-red-600',
            )}>
              {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

**Create barrel export** at `src/components/form/index.ts` in each app:
```typescript
export { FormField } from './form-field';
export { FormSection } from './form-section';
export { SearchInput } from './search-input';
export { DatePicker } from './date-picker';
export { FileUpload } from './file-upload';
export { ConfirmDialog } from './confirm-dialog';
export { EmptyState } from './empty-state';
export { LoadingSpinner } from './loading-spinner';
export { PageHeader } from './page-header';
export { StatCard } from './stat-card';
```

### 39.3 Shared Hooks

Create in `src/hooks/` in each app:

**use-debounce.ts**:
```typescript
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

**use-pagination.ts** — Syncs pagination state with URL:
```typescript
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

interface PaginationOptions {
  defaultPageSize?: number;
}

export function usePagination({ defaultPageSize = 20 }: PaginationOptions = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get('page')) || 1;
  const pageSize = Number(searchParams.get('pageSize')) || defaultPageSize;

  const setPage = useCallback((newPage: number) => {
    setSearchParams((prev) => {
      prev.set('page', String(newPage));
      return prev;
    });
  }, [setSearchParams]);

  const setPageSize = useCallback((newPageSize: number) => {
    setSearchParams((prev) => {
      prev.set('pageSize', String(newPageSize));
      prev.set('page', '1'); // Reset to page 1 on page size change
      return prev;
    });
  }, [setSearchParams]);

  return useMemo(() => ({ page, pageSize, setPage, setPageSize }), [page, pageSize, setPage, setPageSize]);
}
```

**use-query-params.ts** — Read/write URL query parameters for filters:
```typescript
import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

export function useQueryParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const getParam = useCallback((key: string) => searchParams.get(key) || '', [searchParams]);

  const setParam = useCallback((key: string, value: string) => {
    setSearchParams((prev) => {
      if (value) prev.set(key, value);
      else prev.delete(key);
      return prev;
    });
  }, [setSearchParams]);

  const setParams = useCallback((params: Record<string, string>) => {
    setSearchParams((prev) => {
      Object.entries(params).forEach(([key, value]) => {
        if (value) prev.set(key, value);
        else prev.delete(key);
      });
      return prev;
    });
  }, [setSearchParams]);

  const clearParams = useCallback((keys?: string[]) => {
    setSearchParams((prev) => {
      if (keys) keys.forEach((key) => prev.delete(key));
      else { /* clear all filter params, keep page/pageSize */ }
      return prev;
    });
  }, [setSearchParams]);

  return { getParam, setParam, setParams, clearParams, searchParams };
}
```

**use-media-query.ts** — Responsive breakpoint detection:
```typescript
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

// Convenience hooks
export const useIsMobile = () => useMediaQuery('(max-width: 767px)');
export const useIsTablet = () => useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');
```

**use-local-storage.ts**:
```typescript
import { useState, useCallback } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue((prev) => {
      const nextValue = value instanceof Function ? value(prev) : value;
      window.localStorage.setItem(key, JSON.stringify(nextValue));
      return nextValue;
    });
  }, [key]);

  return [storedValue, setValue];
}
```

### 39.4 Error Boundary

Create `src/components/error-boundary.tsx` in each app:

```typescript
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-[400px] items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
              <CardTitle className="mt-4">Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                {this.state.error?.message || 'An unexpected error occurred.'}
              </p>
              <Button onClick={() => this.setState({ hasError: false, error: null })}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
```

Wrap each app's main content with ErrorBoundary in `App.tsx`:
```typescript
export default function App() {
  return (
    <ErrorBoundary>
      <Routes>...</Routes>
    </ErrorBoundary>
  );
}
```

### 39.5 Not Found Page

Create `src/features/not-found/not-found-page.tsx` in each app:

```typescript
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center">
        <FileQuestion className="mx-auto h-16 w-16 text-muted-foreground/50" />
        <h1 className="mt-4 text-4xl font-bold">404</h1>
        <p className="mt-2 text-lg text-muted-foreground">{t('common.pageNotFound')}</p>
        <Button asChild className="mt-6">
          <Link to="/">{t('common.goHome')}</Link>
        </Button>
      </div>
    </div>
  );
}
```

Update the catch-all route in each app to use NotFoundPage:
```typescript
<Route path="*" element={<NotFoundPage />} />
```

## Acceptance Criteria
- [ ] Data table component exists in all 3 apps with server-side pagination, sorting, filtering support
- [ ] Data table shows loading skeleton when `isLoading=true`
- [ ] Data table shows empty state when data array is empty
- [ ] Data table row selection works with checkboxes
- [ ] FormField component wraps label + input + error message with Zod error display
- [ ] FormSection component renders card-based form sections
- [ ] SearchInput component has built-in debounce and clear button
- [ ] DatePicker component works with date selection
- [ ] FileUpload component supports drag & drop with progress bar
- [ ] ConfirmDialog component renders customizable confirmation with destructive variant
- [ ] EmptyState component renders icon + message + optional action button
- [ ] LoadingSpinner component renders consistent spinner in 3 sizes
- [ ] PageHeader component renders title + breadcrumbs + action buttons
- [ ] StatCard component renders stat with icon, value, and optional trend
- [ ] StatusBadge component renders colored badges per status
- [ ] `useDebounce` hook debounces values with configurable delay
- [ ] `usePagination` hook syncs page/pageSize with URL search params
- [ ] `useQueryParams` hook reads/writes URL query parameters
- [ ] `useMediaQuery` hook detects responsive breakpoints
- [ ] `useLocalStorage` hook manages localStorage with state
- [ ] ErrorBoundary catches React render errors and shows retry UI
- [ ] NotFoundPage renders 404 with link to home
- [ ] All components are responsive
- [ ] All 3 apps build with 0 errors

## Files to Create/Modify
For each app (`apps/admin`, `apps/provider-portal`, `apps/web`):
- `src/components/data-table/*.tsx` (create or update — 6 files)
- `src/components/form/form-field.tsx` (create)
- `src/components/form/form-section.tsx` (create)
- `src/components/form/search-input.tsx` (create)
- `src/components/form/date-picker.tsx` (create)
- `src/components/form/file-upload.tsx` (create)
- `src/components/form/confirm-dialog.tsx` (create)
- `src/components/form/empty-state.tsx` (create)
- `src/components/form/loading-spinner.tsx` (create)
- `src/components/form/page-header.tsx` (create)
- `src/components/form/stat-card.tsx` (create)
- `src/components/form/index.ts` (create)
- `src/components/status-badge.tsx` (create or verify)
- `src/components/error-boundary.tsx` (create)
- `src/hooks/use-debounce.ts` (create)
- `src/hooks/use-pagination.ts` (create)
- `src/hooks/use-query-params.ts` (create)
- `src/hooks/use-media-query.ts` (create)
- `src/hooks/use-local-storage.ts` (create)
- `src/features/not-found/not-found-page.tsx` (create)
- `src/App.tsx` (modify — add ErrorBoundary wrapper and NotFoundPage route)

## Dependencies
- Task 28 (Frontend Shared Foundation) — shadcn/ui components
- Task 29 (Frontend i18n) — translations for error messages, empty states
- Task 30 (Frontend Auth) — for ErrorBoundary context
- Tasks 31-38 — all pages that will use these components
