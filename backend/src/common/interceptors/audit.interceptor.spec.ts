import { AuditInterceptor } from './audit.interceptor';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { AuditService } from '../../modules/audit/audit.service';
import { AUDITED_KEY } from '../decorators/audited.decorator';

function createMockContext(overrides: {
  method?: string;
  path?: string;
  params?: Record<string, string>;
  user?: Record<string, string>;
  ip?: string;
  headers?: Record<string, string>;
} = {}): ExecutionContext {
  const request = {
    method: overrides.method || 'POST',
    path: overrides.path || '/api/v1/tenants/t1/users',
    originalUrl: overrides.path || '/api/v1/tenants/t1/users',
    params: overrides.params || {},
    user: overrides.user || { sub: 'user-1', userType: 'tenant' },
    ip: overrides.ip || '127.0.0.1',
    headers: overrides.headers || { 'user-agent': 'TestAgent/1.0' },
    socket: { remoteAddress: '127.0.0.1' },
  };

  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({}),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

function createMockCallHandler(data: unknown): CallHandler {
  return { handle: () => of(data) };
}

describe('AuditInterceptor', () => {
  let interceptor: AuditInterceptor;
  let reflector: Reflector;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(() => {
    reflector = new Reflector();
    auditService = {
      log: jest.fn().mockResolvedValue({ success: true }),
    } as any;
    interceptor = new AuditInterceptor(reflector, auditService);
  });

  it('should skip non-audited handlers', (done) => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const context = createMockContext();
    const data = { id: '1', name: 'Test' };

    interceptor.intercept(context, createMockCallHandler(data)).subscribe((result) => {
      expect(result).toEqual(data);
      expect(auditService.log).not.toHaveBeenCalled();
      done();
    });
  });

  it('should log CREATE action for POST requests on audited handlers', (done) => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({});

    const context = createMockContext({
      method: 'POST',
      path: '/api/v1/tenants/t1/users',
      user: { sub: 'user-1', userType: 'tenant' },
    });

    const responseData = { id: 'new-user-1', name: 'New User' };

    interceptor.intercept(context, createMockCallHandler(responseData)).subscribe(() => {
      // Allow async fire-and-forget to complete
      setTimeout(() => {
        expect(auditService.log).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'CREATE',
            entity: 'users',
            userId: 'user-1',
            userType: 'tenant',
          }),
        );
        done();
      }, 10);
    });
  });

  it('should log UPDATE action for PATCH requests', (done) => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({});

    const context = createMockContext({
      method: 'PATCH',
      path: '/api/v1/tenants/t1/users/user-2',
      params: { id: 'user-2', tenantId: 't1' },
    });

    const responseData = { id: 'user-2', name: 'Updated' };

    interceptor.intercept(context, createMockCallHandler(responseData)).subscribe(() => {
      setTimeout(() => {
        expect(auditService.log).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'UPDATE',
            entity: 'users',
            entityId: 'user-2',
          }),
        );
        done();
      }, 10);
    });
  });

  it('should log DELETE action for DELETE requests', (done) => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({});

    const context = createMockContext({
      method: 'DELETE',
      path: '/api/v1/tenants/t1/users/user-3',
      params: { id: 'user-3', tenantId: 't1' },
    });

    interceptor.intercept(context, createMockCallHandler({ deleted: true })).subscribe(() => {
      setTimeout(() => {
        expect(auditService.log).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'DELETE',
            entityId: 'user-3',
          }),
        );
        done();
      }, 10);
    });
  });

  it('should skip GET requests even on audited handlers', (done) => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({});

    const context = createMockContext({ method: 'GET' });
    const data = [{ id: '1' }];

    interceptor.intercept(context, createMockCallHandler(data)).subscribe((result) => {
      expect(result).toEqual(data);
      setTimeout(() => {
        expect(auditService.log).not.toHaveBeenCalled();
        done();
      }, 10);
    });
  });

  it('should use custom entity name from @Audited({ entity })', (done) => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({ entity: 'custom-entity' });

    const context = createMockContext({ method: 'POST', path: '/api/v1/something' });

    interceptor.intercept(context, createMockCallHandler({ id: '1' })).subscribe(() => {
      setTimeout(() => {
        expect(auditService.log).toHaveBeenCalledWith(
          expect.objectContaining({
            entity: 'custom-entity',
          }),
        );
        done();
      }, 10);
    });
  });

  it('should include IP address and user agent in metadata', (done) => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({});

    const context = createMockContext({
      method: 'POST',
      ip: '10.0.0.1',
      headers: { 'user-agent': 'CustomBrowser/2.0' },
    });

    interceptor.intercept(context, createMockCallHandler({ id: '1' })).subscribe(() => {
      setTimeout(() => {
        expect(auditService.log).toHaveBeenCalledWith(
          expect.objectContaining({
            ipAddress: '10.0.0.1',
            userAgent: 'CustomBrowser/2.0',
            metadata: expect.objectContaining({
              ipAddress: '10.0.0.1',
              userAgent: 'CustomBrowser/2.0',
              method: 'POST',
            }),
          }),
        );
        done();
      }, 10);
    });
  });

  it('should extract entity ID from response when not in params', (done) => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({});

    const context = createMockContext({
      method: 'POST',
      path: '/api/v1/tenants/t1/users',
      params: { tenantId: 't1' },
    });

    const responseData = { id: 'created-id-123', name: 'Created' };

    interceptor.intercept(context, createMockCallHandler(responseData)).subscribe(() => {
      setTimeout(() => {
        expect(auditService.log).toHaveBeenCalledWith(
          expect.objectContaining({
            entityId: 'created-id-123',
          }),
        );
        done();
      }, 10);
    });
  });

  it('should not throw if audit logging fails', (done) => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({});
    auditService.log.mockRejectedValue(new Error('DB error'));

    const context = createMockContext({ method: 'POST' });

    interceptor.intercept(context, createMockCallHandler({ id: '1' })).subscribe((result) => {
      // Response should still be returned even if audit fails
      expect(result).toEqual({ id: '1' });
      done();
    });
  });
});
