import { TransformInterceptor } from './transform.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { PaginatedResult } from '../dto/pagination.dto';

function createMockContext(headers: Record<string, string> = {}): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers }),
      getResponse: () => ({}),
    }),
    getClass: () => ({}),
    getHandler: () => ({}),
  } as unknown as ExecutionContext;
}

function createMockCallHandler(data: unknown): CallHandler {
  return { handle: () => of(data) };
}

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor;

  beforeEach(() => {
    interceptor = new TransformInterceptor();
  });

  it('should wrap a plain object in the success envelope', (done) => {
    const data = { id: '123', name: 'Test' };
    const context = createMockContext({ 'x-correlation-id': 'trace-abc' });

    interceptor.intercept(context, createMockCallHandler(data)).subscribe((result: any) => {
      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
      expect(result.traceId).toBe('trace-abc');
      expect(result.timestamp).toBeDefined();
      expect(typeof result.timestamp).toBe('string');
      done();
    });
  });

  it('should wrap a PaginatedResult with pagination metadata', (done) => {
    const items = [{ id: '1' }, { id: '2' }];
    const paginated = new PaginatedResult(items, 150, 1, 20);
    const context = createMockContext({ 'x-request-id': 'trace-xyz' });

    interceptor.intercept(context, createMockCallHandler(paginated)).subscribe((result: any) => {
      expect(result.success).toBe(true);
      expect(result.data).toEqual(items);
      expect(result.pagination).toEqual({
        page: 1,
        pageSize: 20,
        totalCount: 150,
        totalPages: 8,
      });
      expect(result.traceId).toBe('trace-xyz');
      done();
    });
  });

  it('should detect plain objects with paginated shape', (done) => {
    const data = { items: [{ id: '1' }], total: 50, page: 2, pageSize: 10, totalPages: 5 };
    const context = createMockContext();

    interceptor.intercept(context, createMockCallHandler(data)).subscribe((result: any) => {
      expect(result.success).toBe(true);
      expect(result.data).toEqual([{ id: '1' }]);
      expect(result.pagination.totalCount).toBe(50);
      expect(result.pagination.page).toBe(2);
      done();
    });
  });

  it('should add timestamp and traceId to every response', (done) => {
    const context = createMockContext({ 'x-correlation-id': 'my-trace' });

    interceptor.intercept(context, createMockCallHandler({ ok: true })).subscribe((result: any) => {
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(result.traceId).toBe('my-trace');
      done();
    });
  });

  it('should use x-request-id as fallback for traceId', (done) => {
    const context = createMockContext({ 'x-request-id': 'fallback-id' });

    interceptor.intercept(context, createMockCallHandler({ a: 1 })).subscribe((result: any) => {
      expect(result.traceId).toBe('fallback-id');
      done();
    });
  });

  it('should use empty string when no trace headers present', (done) => {
    const context = createMockContext();

    interceptor.intercept(context, createMockCallHandler({ a: 1 })).subscribe((result: any) => {
      expect(result.traceId).toBe('');
      done();
    });
  });

  it('should NOT wrap null (204 No Content)', (done) => {
    const context = createMockContext();

    interceptor.intercept(context, createMockCallHandler(null)).subscribe((result) => {
      expect(result).toBeNull();
      done();
    });
  });

  it('should NOT wrap undefined (204 No Content)', (done) => {
    const context = createMockContext();

    interceptor.intercept(context, createMockCallHandler(undefined)).subscribe((result) => {
      expect(result).toBeUndefined();
      done();
    });
  });
});
