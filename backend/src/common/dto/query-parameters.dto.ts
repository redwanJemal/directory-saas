import { z } from 'zod';

export const FilterOperators = [
  'eq',
  'in',
  'gt',
  'gte',
  'lt',
  'lte',
  'contains',
  'startsWith',
  'endsWith',
  'isNull',
] as const;

export type FilterOperator = (typeof FilterOperators)[number];

export interface FilterGroup {
  field: string;
  operator: FilterOperator;
  value: string | string[] | number | boolean | null;
}

export interface SortField {
  field: string;
  direction: 'asc' | 'desc';
}

export interface QueryParameters {
  filters: FilterGroup[];
  search?: string;
  sort: SortField[];
  page: number;
  pageSize: number;
  include: string[];
}

export type AllowedFilterType = 'string' | 'number' | 'date' | 'boolean' | 'enum';

export interface AllowedFilter {
  field: string;
  operators: FilterOperator[];
  type: AllowedFilterType;
  values?: string[];
}

export const QueryParametersSchema = z.object({
  filters: z.array(
    z.object({
      field: z.string(),
      operator: z.enum(FilterOperators),
      value: z.union([
        z.string(),
        z.array(z.string()),
        z.number(),
        z.boolean(),
        z.null(),
      ]),
    }),
  ),
  search: z.string().optional(),
  sort: z.array(
    z.object({
      field: z.string(),
      direction: z.enum(['asc', 'desc']),
    }),
  ),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  include: z.array(z.string()),
});
