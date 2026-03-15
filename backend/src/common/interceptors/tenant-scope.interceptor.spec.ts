import { TenantScopeInterceptor } from './tenant-scope.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { RequestContext } from '../services/request-context';

function createMockContext(method: string, body: Record<string, unknown> = {}): ExecutionContext {
  const request = { method, body };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

function createMockHandler(returnValue: unknown = {}): CallHandler {
  return { handle: () => of(returnValue) };
}

describe('TenantScopeInterceptor', () => {
  let interceptor: TenantScopeInterceptor;

  beforeEach(() => {
    interceptor = new TenantScopeInterceptor();
  });

  function runInContext(fn: () => void): void {
    RequestContext.run(fn);
  }

  it('should inject tenantId into POST request body', (done) => {
    runInContext(() => {
      RequestContext.set('tenantId', 'tenant-123');
      const body: Record<string, unknown> = { name: 'Test' };
      const ctx = createMockContext('POST', body);
      const handler = createMockHandler();

      interceptor.intercept(ctx, handler).subscribe(() => {
        expect(body.tenantId).toBe('tenant-123');
        done();
      });
    });
  });

  it('should inject tenantId into PATCH request body', (done) => {
    runInContext(() => {
      RequestContext.set('tenantId', 'tenant-123');
      const body: Record<string, unknown> = { name: 'Updated' };
      const ctx = createMockContext('PATCH', body);
      const handler = createMockHandler();

      interceptor.intercept(ctx, handler).subscribe(() => {
        expect(body.tenantId).toBe('tenant-123');
        done();
      });
    });
  });

  it('should inject tenantId into PUT request body', (done) => {
    runInContext(() => {
      RequestContext.set('tenantId', 'tenant-123');
      const body: Record<string, unknown> = { name: 'Replaced' };
      const ctx = createMockContext('PUT', body);
      const handler = createMockHandler();

      interceptor.intercept(ctx, handler).subscribe(() => {
        expect(body.tenantId).toBe('tenant-123');
        done();
      });
    });
  });

  it('should NOT inject tenantId into GET request', (done) => {
    runInContext(() => {
      RequestContext.set('tenantId', 'tenant-123');
      const body: Record<string, unknown> = {};
      const ctx = createMockContext('GET', body);
      const handler = createMockHandler();

      interceptor.intercept(ctx, handler).subscribe(() => {
        expect(body.tenantId).toBeUndefined();
        done();
      });
    });
  });

  it('should NOT inject tenantId into DELETE request', (done) => {
    runInContext(() => {
      RequestContext.set('tenantId', 'tenant-123');
      const body: Record<string, unknown> = {};
      const ctx = createMockContext('DELETE', body);
      const handler = createMockHandler();

      interceptor.intercept(ctx, handler).subscribe(() => {
        expect(body.tenantId).toBeUndefined();
        done();
      });
    });
  });

  it('should NOT overwrite existing tenantId in body', (done) => {
    runInContext(() => {
      RequestContext.set('tenantId', 'tenant-123');
      const body: Record<string, unknown> = { tenantId: 'existing-tenant' };
      const ctx = createMockContext('POST', body);
      const handler = createMockHandler();

      interceptor.intercept(ctx, handler).subscribe(() => {
        expect(body.tenantId).toBe('existing-tenant');
        done();
      });
    });
  });

  it('should NOT inject when no tenant in context', (done) => {
    runInContext(() => {
      const body: Record<string, unknown> = { name: 'Test' };
      const ctx = createMockContext('POST', body);
      const handler = createMockHandler();

      interceptor.intercept(ctx, handler).subscribe(() => {
        expect(body.tenantId).toBeUndefined();
        done();
      });
    });
  });
});
