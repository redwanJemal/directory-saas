import { type Table as ReactTable } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FilterOption {
  label: string;
  value: string;
}

interface BulkAction {
  label: string;
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'destructive';
}

interface DataTableToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: Array<{
    key: string;
    label: string;
    options: FilterOption[];
    value: string;
    onChange: (value: string) => void;
  }>;
  bulkActions?: BulkAction[];
  selectedCount?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table?: ReactTable<any>;
  actions?: React.ReactNode;
}

export function DataTableToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  filters,
  bulkActions,
  selectedCount = 0,
  table,
  actions,
}: DataTableToolbarProps) {
  const { t } = useTranslation();
  const hasActiveFilters =
    searchValue || filters?.some((f) => f.value && f.value !== 'all');

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex flex-1 items-center gap-2">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder ?? t('common.search')}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8"
          />
          {searchValue && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-7 w-7"
              onClick={() => onSearchChange('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {filters?.map((filter) => (
          <Select
            key={filter.key}
            value={filter.value}
            onValueChange={filter.onChange}
          >
            <SelectTrigger className="h-9 w-[150px]">
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{filter.label}</SelectItem>
              {filter.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onSearchChange('');
              filters?.forEach((f) => f.onChange('all'));
            }}
          >
            <X className="mr-2 h-4 w-4" />
            {t('common.clearFilters')}
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {selectedCount > 0 && bulkActions && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedCount} {t('common.selected')}
            </span>
            {bulkActions.map((action, i) => (
              <Button
                key={i}
                variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
                size="sm"
                onClick={action.onClick}
              >
                {action.icon && <action.icon className="mr-2 h-4 w-4" />}
                {action.label}
              </Button>
            ))}
          </div>
        )}
        {table && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                {t('common.columns')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {actions && <>{actions}</>}
      </div>
    </div>
  );
}
