import { PaginatedResult, paginate } from './pagination.dto';

describe('PaginatedResult', () => {
  it('should calculate totalPages correctly', () => {
    const result = new PaginatedResult(['a', 'b'], 150, 1, 20);
    expect(result.totalPages).toBe(8);
  });

  it('should handle exact page boundary', () => {
    const result = new PaginatedResult(['a'], 100, 5, 20);
    expect(result.totalPages).toBe(5);
  });

  it('should handle 0 items', () => {
    const result = new PaginatedResult([], 0, 1, 20);
    expect(result.totalPages).toBe(0);
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('should handle 1 item', () => {
    const result = new PaginatedResult([{ id: '1' }], 1, 1, 20);
    expect(result.totalPages).toBe(1);
    expect(result.items).toEqual([{ id: '1' }]);
  });

  it('should store page and pageSize', () => {
    const result = new PaginatedResult([], 50, 3, 10);
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(10);
    expect(result.total).toBe(50);
  });
});

describe('paginate', () => {
  it('should create a PaginatedResult from items, total, and query', () => {
    const result = paginate(['x', 'y'], 42, { page: 2, pageSize: 10 });
    expect(result).toBeInstanceOf(PaginatedResult);
    expect(result.items).toEqual(['x', 'y']);
    expect(result.total).toBe(42);
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(10);
    expect(result.totalPages).toBe(5);
  });

  it('should calculate totalPages correctly for 0 items', () => {
    const result = paginate([], 0, { page: 1, pageSize: 20 });
    expect(result.totalPages).toBe(0);
  });

  it('should handle exact page boundary', () => {
    const result = paginate(['a'], 60, { page: 3, pageSize: 20 });
    expect(result.totalPages).toBe(3);
  });

  it('should round up totalPages for partial last page', () => {
    const result = paginate(['a'], 61, { page: 4, pageSize: 20 });
    expect(result.totalPages).toBe(4);
  });
});
