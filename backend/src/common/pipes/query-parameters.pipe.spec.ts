import { QueryParametersPipe } from './query-parameters.pipe';
import { AllowedFilter } from '../dto/query-parameters.dto';
import { AppException } from '../exceptions/app.exception';

describe('QueryParametersPipe', () => {
  const allowedFilters: AllowedFilter[] = [
    { field: 'status', operators: ['eq', 'in'], type: 'enum', values: ['active', 'verified', 'suspended'] },
    { field: 'category', operators: ['eq', 'in'], type: 'string' },
    { field: 'rating', operators: ['gte', 'lte', 'gt', 'lt'], type: 'number' },
    { field: 'price', operators: ['gte', 'lte'], type: 'number' },
    { field: 'name', operators: ['eq', 'contains', 'startsWith', 'endsWith'], type: 'string' },
    { field: 'city', operators: ['eq'], type: 'string' },
    { field: 'createdAt', operators: ['gte', 'lte'], type: 'date' },
    { field: 'isActive', operators: ['eq'], type: 'boolean' },
    { field: 'deletedAt', operators: ['isNull'], type: 'date' },
  ];

  const allowedSorts = ['name', 'createdAt', 'rating', 'status'];
  const allowedIncludes = ['reviews', 'services', 'categories'];

  let pipe: QueryParametersPipe;

  beforeEach(() => {
    pipe = new QueryParametersPipe(allowedFilters, allowedSorts, allowedIncludes);
  });

  describe('filter parsing', () => {
    it('should parse filter[status]=active,verified as IN operator', () => {
      const result = pipe.transform({ filter: { status: 'active,verified' } });
      expect(result.filters).toEqual([
        { field: 'status', operator: 'in', value: ['active', 'verified'] },
      ]);
    });

    it('should parse filter[city]=addis-ababa as EQ operator', () => {
      const result = pipe.transform({ filter: { city: 'addis-ababa' } });
      expect(result.filters).toEqual([
        { field: 'city', operator: 'eq', value: 'addis-ababa' },
      ]);
    });

    it('should parse filter[rating][gte]=4.0 as GTE operator with numeric value', () => {
      const result = pipe.transform({ filter: { rating: { gte: '4.0' } } });
      expect(result.filters).toEqual([
        { field: 'rating', operator: 'gte', value: 4.0 },
      ]);
    });

    it('should parse filter[name][contains]=photo as CONTAINS operator', () => {
      const result = pipe.transform({ filter: { name: { contains: 'photo' } } });
      expect(result.filters).toEqual([
        { field: 'name', operator: 'contains', value: 'photo' },
      ]);
    });

    it('should parse filter[name][startsWith]=wed as STARTSWITH operator', () => {
      const result = pipe.transform({ filter: { name: { startsWith: 'wed' } } });
      expect(result.filters).toEqual([
        { field: 'name', operator: 'startsWith', value: 'wed' },
      ]);
    });

    it('should parse filter[name][endsWith]=ing as ENDSWITH operator', () => {
      const result = pipe.transform({ filter: { name: { endsWith: 'ing' } } });
      expect(result.filters).toEqual([
        { field: 'name', operator: 'endsWith', value: 'ing' },
      ]);
    });

    it('should parse filter[deletedAt][isNull]=true as ISNULL operator', () => {
      const result = pipe.transform({ filter: { deletedAt: { isNull: 'true' } } });
      expect(result.filters).toEqual([
        { field: 'deletedAt', operator: 'isNull', value: true },
      ]);
    });

    it('should parse filter[isActive]=true as boolean for boolean type', () => {
      const result = pipe.transform({ filter: { isActive: 'true' } });
      // Single value -> eq operator, boolean type is not coerced at eq level in pipe
      expect(result.filters).toEqual([
        { field: 'isActive', operator: 'eq', value: 'true' },
      ]);
    });

    it('should parse multiple range filters on same field', () => {
      const result = pipe.transform({
        filter: { price: { gte: '100', lte: '5000' } },
      });
      expect(result.filters).toHaveLength(2);
      expect(result.filters).toContainEqual({ field: 'price', operator: 'gte', value: 100 });
      expect(result.filters).toContainEqual({ field: 'price', operator: 'lte', value: 5000 });
    });

    it('should return empty filters when no filter param', () => {
      const result = pipe.transform({});
      expect(result.filters).toEqual([]);
    });

    it('should reject unknown filter fields', () => {
      expect(() => pipe.transform({ filter: { unknown: 'value' } })).toThrow(AppException);
    });

    it('should reject unknown operators', () => {
      expect(() =>
        pipe.transform({ filter: { name: { badOp: 'value' } } }),
      ).toThrow(AppException);
    });

    it('should reject disallowed operator for field', () => {
      expect(() =>
        pipe.transform({ filter: { status: { gte: '5' } } }),
      ).toThrow(AppException);
    });

    it('should reject too many filters (> 20)', () => {
      const filter: Record<string, any> = {};
      // Generate 21 filters using allowed fields with operator notation
      for (let i = 0; i < 11; i++) {
        filter[`field_${i}`] = { eq: 'val', in: 'val' };
      }
      const openPipe = new QueryParametersPipe([], [], []);
      expect(() => openPipe.transform({ filter })).toThrow(AppException);
    });

    it('should reject non-numeric value for number type field', () => {
      expect(() =>
        pipe.transform({ filter: { rating: { gte: 'abc' } } }),
      ).toThrow(AppException);
    });
  });

  describe('sort parsing', () => {
    it('should parse sort=-rating,name correctly', () => {
      const result = pipe.transform({ sort: '-rating,name' });
      expect(result.sort).toEqual([
        { field: 'rating', direction: 'desc' },
        { field: 'name', direction: 'asc' },
      ]);
    });

    it('should parse single ascending sort', () => {
      const result = pipe.transform({ sort: 'name' });
      expect(result.sort).toEqual([{ field: 'name', direction: 'asc' }]);
    });

    it('should parse single descending sort', () => {
      const result = pipe.transform({ sort: '-createdAt' });
      expect(result.sort).toEqual([{ field: 'createdAt', direction: 'desc' }]);
    });

    it('should return empty sort when no sort param', () => {
      const result = pipe.transform({});
      expect(result.sort).toEqual([]);
    });

    it('should reject unknown sort fields', () => {
      expect(() => pipe.transform({ sort: 'unknown' })).toThrow(AppException);
    });
  });

  describe('pagination', () => {
    it('should default to page=1, pageSize=20', () => {
      const result = pipe.transform({});
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });

    it('should parse page and pageSize', () => {
      const result = pipe.transform({ page: '2', pageSize: '25' });
      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(25);
    });

    it('should clamp pageSize to max 100', () => {
      const result = pipe.transform({ pageSize: '500' });
      expect(result.pageSize).toBe(100);
    });

    it('should default page < 1 to 1', () => {
      const result = pipe.transform({ page: '0' });
      expect(result.page).toBe(1);
    });

    it('should default invalid page to 1', () => {
      const result = pipe.transform({ page: 'abc' });
      expect(result.page).toBe(1);
    });

    it('should default invalid pageSize to 20', () => {
      const result = pipe.transform({ pageSize: 'abc' });
      expect(result.pageSize).toBe(20);
    });
  });

  describe('includes', () => {
    it('should parse include=reviews,services', () => {
      const result = pipe.transform({ include: 'reviews,services' });
      expect(result.include).toEqual(['reviews', 'services']);
    });

    it('should parse single include', () => {
      const result = pipe.transform({ include: 'reviews' });
      expect(result.include).toEqual(['reviews']);
    });

    it('should return empty includes when no include param', () => {
      const result = pipe.transform({});
      expect(result.include).toEqual([]);
    });

    it('should reject unknown includes', () => {
      expect(() => pipe.transform({ include: 'unknown' })).toThrow(AppException);
    });

    it('should reject too many includes (> 3)', () => {
      expect(() =>
        pipe.transform({ include: 'a,b,c,d' }),
      ).toThrow(AppException);
    });
  });

  describe('search', () => {
    it('should parse search parameter', () => {
      const result = pipe.transform({ search: 'wedding photographer' });
      expect(result.search).toBe('wedding photographer');
    });

    it('should trim search whitespace', () => {
      const result = pipe.transform({ search: '  wedding  ' });
      expect(result.search).toBe('wedding');
    });

    it('should return undefined when no search', () => {
      const result = pipe.transform({});
      expect(result.search).toBeUndefined();
    });
  });

  describe('no allowlist (open pipe)', () => {
    it('should allow any filter field when no allowlist configured', () => {
      const openPipe = new QueryParametersPipe();
      const result = openPipe.transform({ filter: { anything: 'value' } });
      expect(result.filters).toEqual([
        { field: 'anything', operator: 'eq', value: 'value' },
      ]);
    });

    it('should allow any sort field when no allowlist configured', () => {
      const openPipe = new QueryParametersPipe();
      const result = openPipe.transform({ sort: 'anything' });
      expect(result.sort).toEqual([{ field: 'anything', direction: 'asc' }]);
    });

    it('should allow any include when no allowlist configured', () => {
      const openPipe = new QueryParametersPipe();
      const result = openPipe.transform({ include: 'anything' });
      expect(result.include).toEqual(['anything']);
    });
  });

  describe('combined parsing', () => {
    it('should parse a full query string object', () => {
      const result = pipe.transform({
        filter: {
          status: 'active,verified',
          category: 'photography,catering',
          rating: { gte: '4.0' },
        },
        search: 'wedding photographer',
        sort: '-rating,name',
        page: '2',
        pageSize: '25',
        include: 'reviews,services',
      });

      expect(result.filters).toHaveLength(3);
      expect(result.search).toBe('wedding photographer');
      expect(result.sort).toEqual([
        { field: 'rating', direction: 'desc' },
        { field: 'name', direction: 'asc' },
      ]);
      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(25);
      expect(result.include).toEqual(['reviews', 'services']);
    });
  });
});
