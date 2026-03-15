import { PipeTransform } from '@nestjs/common';
import { AppException } from '../exceptions/app.exception';
import { ErrorCodes } from '../constants/error-codes';
import {
  AllowedFilter,
  FilterGroup,
  FilterOperator,
  FilterOperators,
  QueryParameters,
  SortField,
} from '../dto/query-parameters.dto';

const MAX_FILTERS = 20;
const MAX_INCLUDES = 3;
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export class QueryParametersPipe implements PipeTransform {
  constructor(
    private readonly allowedFilters: AllowedFilter[] = [],
    private readonly allowedSorts: string[] = [],
    private readonly allowedIncludes: string[] = [],
  ) {}

  transform(value: Record<string, any>): QueryParameters {
    const raw = value ?? {};

    const filters = this.parseFilters(raw);
    const sort = this.parseSort(raw.sort);
    const page = this.parsePage(raw.page);
    const pageSize = this.parsePageSize(raw.pageSize);
    const include = this.parseIncludes(raw.include);
    const search = raw.search ? String(raw.search).trim() : undefined;

    return { filters, search, sort, page, pageSize, include };
  }

  private parseFilters(raw: Record<string, any>): FilterGroup[] {
    const filter = raw.filter;
    if (!filter || typeof filter !== 'object') return [];

    const groups: FilterGroup[] = [];

    for (const field of Object.keys(filter)) {
      const filterVal = filter[field];

      if (typeof filterVal === 'object' && filterVal !== null && !Array.isArray(filterVal)) {
        // Operator notation: filter[field][operator]=value
        for (const op of Object.keys(filterVal)) {
          const operator = op as FilterOperator;
          if (!FilterOperators.includes(operator)) {
            throw new AppException(
              ErrorCodes.VALIDATION_ERROR,
              `Unknown filter operator '${op}' for field '${field}'`,
            );
          }
          this.validateFilterField(field, operator);
          groups.push({
            field,
            operator,
            value: this.coerceFilterValue(field, operator, String(filterVal[op])),
          });
        }
      } else {
        // Simple notation: filter[field]=value or filter[field]=a,b,c
        const strVal = String(filterVal);
        const parts = strVal.split(',').map((s) => s.trim()).filter(Boolean);

        if (parts.length > 1) {
          this.validateFilterField(field, 'in');
          groups.push({
            field,
            operator: 'in',
            value: parts,
          });
        } else {
          this.validateFilterField(field, 'eq');
          groups.push({
            field,
            operator: 'eq',
            value: strVal,
          });
        }
      }
    }

    if (groups.length > MAX_FILTERS) {
      throw new AppException(
        ErrorCodes.VALIDATION_ERROR,
        `Too many filters (max ${MAX_FILTERS})`,
      );
    }

    return groups;
  }

  private validateFilterField(field: string, operator: FilterOperator): void {
    if (this.allowedFilters.length === 0) return;

    const allowed = this.allowedFilters.find((f) => f.field === field);
    if (!allowed) {
      throw new AppException(
        ErrorCodes.VALIDATION_ERROR,
        `Filter field '${field}' is not allowed`,
      );
    }

    if (!allowed.operators.includes(operator)) {
      throw new AppException(
        ErrorCodes.VALIDATION_ERROR,
        `Operator '${operator}' is not allowed for field '${field}'`,
      );
    }
  }

  private coerceFilterValue(
    field: string,
    operator: FilterOperator,
    value: string,
  ): string | number | boolean | null {
    if (operator === 'isNull') {
      return value === 'true';
    }

    const allowed = this.allowedFilters.find((f) => f.field === field);
    if (!allowed) return value;

    switch (allowed.type) {
      case 'number': {
        const num = Number(value);
        if (isNaN(num)) {
          throw new AppException(
            ErrorCodes.VALIDATION_ERROR,
            `Filter value for '${field}' must be a number`,
          );
        }
        return num;
      }
      case 'boolean':
        return value === 'true';
      default:
        return value;
    }
  }

  private parseSort(raw: string | undefined): SortField[] {
    if (!raw) return [];
    const fields = String(raw).split(',').map((s) => s.trim()).filter(Boolean);

    return fields.map((f) => {
      const desc = f.startsWith('-');
      const field = desc ? f.slice(1) : f;

      if (this.allowedSorts.length > 0 && !this.allowedSorts.includes(field)) {
        throw new AppException(
          ErrorCodes.VALIDATION_ERROR,
          `Sort field '${field}' is not allowed`,
        );
      }

      return { field, direction: desc ? 'desc' : 'asc' } as SortField;
    });
  }

  private parsePage(raw: string | undefined): number {
    if (!raw) return DEFAULT_PAGE;
    const page = parseInt(String(raw), 10);
    return isNaN(page) || page < 1 ? DEFAULT_PAGE : page;
  }

  private parsePageSize(raw: string | undefined): number {
    if (!raw) return DEFAULT_PAGE_SIZE;
    const size = parseInt(String(raw), 10);
    if (isNaN(size) || size < 1) return DEFAULT_PAGE_SIZE;
    return Math.min(size, MAX_PAGE_SIZE);
  }

  private parseIncludes(raw: string | undefined): string[] {
    if (!raw) return [];
    const includes = String(raw).split(',').map((s) => s.trim()).filter(Boolean);

    if (includes.length > MAX_INCLUDES) {
      throw new AppException(
        ErrorCodes.VALIDATION_ERROR,
        `Too many includes (max ${MAX_INCLUDES})`,
      );
    }

    if (this.allowedIncludes.length > 0) {
      for (const inc of includes) {
        if (!this.allowedIncludes.includes(inc)) {
          throw new AppException(
            ErrorCodes.VALIDATION_ERROR,
            `Include '${inc}' is not allowed`,
          );
        }
      }
    }

    return includes;
  }
}
