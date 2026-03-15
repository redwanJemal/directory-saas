import { buildPrismaQuery } from './prisma-query-builder';
import { AllowedFilter, QueryParameters } from '../dto/query-parameters.dto';
import { AppException } from '../exceptions/app.exception';

describe('buildPrismaQuery', () => {
  const allowedFilters: AllowedFilter[] = [
    { field: 'status', operators: ['eq', 'in'], type: 'enum', values: ['ACTIVE', 'SUSPENDED'] },
    { field: 'name', operators: ['eq', 'contains', 'startsWith', 'endsWith'], type: 'string' },
    { field: 'rating', operators: ['gte', 'lte', 'gt', 'lt'], type: 'number' },
    { field: 'createdAt', operators: ['gte', 'lte'], type: 'date' },
    { field: 'deletedAt', operators: ['isNull'], type: 'date' },
  ];
  const allowedSorts = ['name', 'createdAt', 'rating'];
  const allowedIncludes = ['reviews', 'services'];

  function makeParams(overrides: Partial<QueryParameters> = {}): QueryParameters {
    return {
      filters: [],
      sort: [],
      page: 1,
      pageSize: 20,
      include: [],
      ...overrides,
    };
  }

  describe('where clause', () => {
    it('should map eq filter to direct value', () => {
      const result = buildPrismaQuery(
        makeParams({ filters: [{ field: 'status', operator: 'eq', value: 'ACTIVE' }] }),
        allowedFilters,
        allowedSorts,
        allowedIncludes,
      );
      expect(result.where.status).toBe('ACTIVE');
    });

    it('should map in filter to { in: [...] }', () => {
      const result = buildPrismaQuery(
        makeParams({ filters: [{ field: 'status', operator: 'in', value: ['ACTIVE', 'SUSPENDED'] }] }),
        allowedFilters,
        allowedSorts,
        allowedIncludes,
      );
      expect(result.where.status).toEqual({ in: ['ACTIVE', 'SUSPENDED'] });
    });

    it('should map gt filter', () => {
      const result = buildPrismaQuery(
        makeParams({ filters: [{ field: 'rating', operator: 'gt', value: 3 }] }),
        allowedFilters,
        allowedSorts,
        allowedIncludes,
      );
      expect(result.where.rating).toEqual({ gt: 3 });
    });

    it('should map gte filter', () => {
      const result = buildPrismaQuery(
        makeParams({ filters: [{ field: 'rating', operator: 'gte', value: 4 }] }),
        allowedFilters,
        allowedSorts,
        allowedIncludes,
      );
      expect(result.where.rating).toEqual({ gte: 4 });
    });

    it('should map lt filter', () => {
      const result = buildPrismaQuery(
        makeParams({ filters: [{ field: 'rating', operator: 'lt', value: 3 }] }),
        allowedFilters,
        allowedSorts,
        allowedIncludes,
      );
      expect(result.where.rating).toEqual({ lt: 3 });
    });

    it('should map lte filter', () => {
      const result = buildPrismaQuery(
        makeParams({ filters: [{ field: 'rating', operator: 'lte', value: 5 }] }),
        allowedFilters,
        allowedSorts,
        allowedIncludes,
      );
      expect(result.where.rating).toEqual({ lte: 5 });
    });

    it('should map contains filter with case-insensitive mode', () => {
      const result = buildPrismaQuery(
        makeParams({ filters: [{ field: 'name', operator: 'contains', value: 'photo' }] }),
        allowedFilters,
        allowedSorts,
        allowedIncludes,
      );
      expect(result.where.name).toEqual({ contains: 'photo', mode: 'insensitive' });
    });

    it('should map startsWith filter with case-insensitive mode', () => {
      const result = buildPrismaQuery(
        makeParams({ filters: [{ field: 'name', operator: 'startsWith', value: 'wed' }] }),
        allowedFilters,
        allowedSorts,
        allowedIncludes,
      );
      expect(result.where.name).toEqual({ startsWith: 'wed', mode: 'insensitive' });
    });

    it('should map endsWith filter with case-insensitive mode', () => {
      const result = buildPrismaQuery(
        makeParams({ filters: [{ field: 'name', operator: 'endsWith', value: 'ing' }] }),
        allowedFilters,
        allowedSorts,
        allowedIncludes,
      );
      expect(result.where.name).toEqual({ endsWith: 'ing', mode: 'insensitive' });
    });

    it('should map isNull=true to null', () => {
      const result = buildPrismaQuery(
        makeParams({ filters: [{ field: 'deletedAt', operator: 'isNull', value: true }] }),
        allowedFilters,
        allowedSorts,
        allowedIncludes,
      );
      expect(result.where.deletedAt).toBeNull();
    });

    it('should map isNull=false to { not: null }', () => {
      const result = buildPrismaQuery(
        makeParams({ filters: [{ field: 'deletedAt', operator: 'isNull', value: false }] }),
        allowedFilters,
        allowedSorts,
        allowedIncludes,
      );
      expect(result.where.deletedAt).toEqual({ not: null });
    });

    it('should add deletedAt: null automatically when not filtering by deletedAt', () => {
      const result = buildPrismaQuery(
        makeParams({ filters: [{ field: 'status', operator: 'eq', value: 'ACTIVE' }] }),
        allowedFilters,
        allowedSorts,
        allowedIncludes,
      );
      expect(result.where.deletedAt).toBeNull();
    });

    it('should NOT add deletedAt: null when explicitly filtering by deletedAt', () => {
      const result = buildPrismaQuery(
        makeParams({ filters: [{ field: 'deletedAt', operator: 'isNull', value: false }] }),
        allowedFilters,
        allowedSorts,
        allowedIncludes,
      );
      // It should use the explicit filter value, not override to null
      expect(result.where.deletedAt).toEqual({ not: null });
    });

    it('should add deletedAt: null even with no filters', () => {
      const result = buildPrismaQuery(
        makeParams(),
        allowedFilters,
        allowedSorts,
        allowedIncludes,
      );
      expect(result.where.deletedAt).toBeNull();
    });

    it('should reject invalid enum values', () => {
      expect(() =>
        buildPrismaQuery(
          makeParams({ filters: [{ field: 'status', operator: 'eq', value: 'INVALID' }] }),
          allowedFilters,
          allowedSorts,
          allowedIncludes,
        ),
      ).toThrow(AppException);
    });
  });

  describe('orderBy', () => {
    it('should generate correct orderBy for ascending sort', () => {
      const result = buildPrismaQuery(
        makeParams({ sort: [{ field: 'name', direction: 'asc' }] }),
        allowedFilters,
        allowedSorts,
        allowedIncludes,
      );
      expect(result.orderBy).toEqual([{ name: 'asc' }]);
    });

    it('should generate correct orderBy for descending sort', () => {
      const result = buildPrismaQuery(
        makeParams({ sort: [{ field: 'rating', direction: 'desc' }] }),
        allowedFilters,
        allowedSorts,
        allowedIncludes,
      );
      expect(result.orderBy).toEqual([{ rating: 'desc' }]);
    });

    it('should generate multiple orderBy entries', () => {
      const result = buildPrismaQuery(
        makeParams({
          sort: [
            { field: 'rating', direction: 'desc' },
            { field: 'name', direction: 'asc' },
          ],
        }),
        allowedFilters,
        allowedSorts,
        allowedIncludes,
      );
      expect(result.orderBy).toEqual([{ rating: 'desc' }, { name: 'asc' }]);
    });

    it('should return empty orderBy when no sort', () => {
      const result = buildPrismaQuery(
        makeParams(),
        allowedFilters,
        allowedSorts,
        allowedIncludes,
      );
      expect(result.orderBy).toEqual([]);
    });
  });

  describe('skip and take (pagination)', () => {
    it('should calculate skip=0 for page 1', () => {
      const result = buildPrismaQuery(
        makeParams({ page: 1, pageSize: 20 }),
        allowedFilters,
        allowedSorts,
        allowedIncludes,
      );
      expect(result.skip).toBe(0);
      expect(result.take).toBe(20);
    });

    it('should calculate skip correctly for page 2', () => {
      const result = buildPrismaQuery(
        makeParams({ page: 2, pageSize: 25 }),
        allowedFilters,
        allowedSorts,
        allowedIncludes,
      );
      expect(result.skip).toBe(25);
      expect(result.take).toBe(25);
    });

    it('should calculate skip correctly for page 5, pageSize 10', () => {
      const result = buildPrismaQuery(
        makeParams({ page: 5, pageSize: 10 }),
        allowedFilters,
        allowedSorts,
        allowedIncludes,
      );
      expect(result.skip).toBe(40);
      expect(result.take).toBe(10);
    });
  });

  describe('include', () => {
    it('should generate include object for relations', () => {
      const result = buildPrismaQuery(
        makeParams({ include: ['reviews', 'services'] }),
        allowedFilters,
        allowedSorts,
        allowedIncludes,
      );
      expect(result.include).toEqual({ reviews: true, services: true });
    });

    it('should return undefined include when no includes', () => {
      const result = buildPrismaQuery(
        makeParams(),
        allowedFilters,
        allowedSorts,
        allowedIncludes,
      );
      expect(result.include).toBeUndefined();
    });
  });

  describe('no allowlists', () => {
    it('should work without allowlists', () => {
      const result = buildPrismaQuery(
        makeParams({
          filters: [{ field: 'anything', operator: 'eq', value: 'test' }],
          sort: [{ field: 'anything', direction: 'asc' }],
          include: ['anything'],
        }),
      );
      expect(result.where.anything).toBe('test');
      expect(result.orderBy).toEqual([{ anything: 'asc' }]);
      expect(result.include).toEqual({ anything: true });
    });
  });
});
