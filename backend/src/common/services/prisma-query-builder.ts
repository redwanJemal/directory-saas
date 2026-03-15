import {
  AllowedFilter,
  FilterGroup,
  QueryParameters,
} from '../dto/query-parameters.dto';
import { AppException } from '../exceptions/app.exception';
import { ErrorCodes } from '../constants/error-codes';

export interface PrismaQueryArgs {
  where: Record<string, any>;
  orderBy: Record<string, string>[];
  skip: number;
  take: number;
  include?: Record<string, boolean>;
}

export function buildPrismaQuery(
  params: QueryParameters,
  allowedFilters: AllowedFilter[] = [],
  allowedSorts: string[] = [],
  allowedIncludes: string[] = [],
): PrismaQueryArgs {
  const where = buildWhere(params.filters, allowedFilters);
  const orderBy = buildOrderBy(params.sort, allowedSorts);
  const skip = (params.page - 1) * params.pageSize;
  const take = params.pageSize;
  const include = buildInclude(params.include, allowedIncludes);

  const result: PrismaQueryArgs = { where, orderBy, skip, take };
  if (include) result.include = include;

  return result;
}

function buildWhere(
  filters: FilterGroup[],
  allowedFilters: AllowedFilter[],
): Record<string, any> {
  const where: Record<string, any> = {};
  let hasDeletedAtFilter = false;

  for (const filter of filters) {
    if (filter.field === 'deletedAt') {
      hasDeletedAtFilter = true;
    }

    if (allowedFilters.length > 0) {
      const allowed = allowedFilters.find((a) => a.field === filter.field);
      if (allowed?.type === 'enum' && allowed.values) {
        validateEnumValues(filter, allowed.values);
      }
    }

    where[filter.field] = mapFilterToPrisma(filter);
  }

  // Auto-add soft delete filter unless explicitly filtering by deletedAt
  if (!hasDeletedAtFilter) {
    where.deletedAt = null;
  }

  return where;
}

function validateEnumValues(filter: FilterGroup, allowedValues: string[]): void {
  const values = Array.isArray(filter.value)
    ? filter.value
    : [String(filter.value)];

  for (const v of values) {
    if (!allowedValues.includes(v)) {
      throw new AppException(
        ErrorCodes.VALIDATION_ERROR,
        `Invalid value '${v}' for field '${filter.field}'. Allowed: ${allowedValues.join(', ')}`,
      );
    }
  }
}

function mapFilterToPrisma(filter: FilterGroup): any {
  switch (filter.operator) {
    case 'eq':
      return filter.value;
    case 'in':
      return { in: Array.isArray(filter.value) ? filter.value : [filter.value] };
    case 'gt':
      return { gt: filter.value };
    case 'gte':
      return { gte: filter.value };
    case 'lt':
      return { lt: filter.value };
    case 'lte':
      return { lte: filter.value };
    case 'contains':
      return { contains: filter.value, mode: 'insensitive' };
    case 'startsWith':
      return { startsWith: filter.value, mode: 'insensitive' };
    case 'endsWith':
      return { endsWith: filter.value, mode: 'insensitive' };
    case 'isNull':
      return filter.value === true ? null : { not: null };
    default:
      throw new AppException(
        ErrorCodes.VALIDATION_ERROR,
        `Unsupported operator '${filter.operator}'`,
      );
  }
}

function buildOrderBy(
  sort: QueryParameters['sort'],
  allowedSorts: string[],
): Record<string, string>[] {
  if (sort.length === 0) return [];

  return sort.map((s) => {
    if (allowedSorts.length > 0 && !allowedSorts.includes(s.field)) {
      throw new AppException(
        ErrorCodes.VALIDATION_ERROR,
        `Sort field '${s.field}' is not allowed`,
      );
    }
    return { [s.field]: s.direction };
  });
}

function buildInclude(
  includes: string[],
  allowedIncludes: string[],
): Record<string, boolean> | undefined {
  if (includes.length === 0) return undefined;

  const result: Record<string, boolean> = {};
  for (const inc of includes) {
    if (allowedIncludes.length > 0 && !allowedIncludes.includes(inc)) {
      throw new AppException(
        ErrorCodes.VALIDATION_ERROR,
        `Include '${inc}' is not allowed`,
      );
    }
    result[inc] = true;
  }
  return result;
}
