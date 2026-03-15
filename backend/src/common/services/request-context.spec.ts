import { RequestContext } from './request-context';

describe('RequestContext', () => {
  it('should store and retrieve traceId', () => {
    RequestContext.run(() => {
      RequestContext.set('traceId', 'trace-123');
      expect(RequestContext.traceId).toBe('trace-123');
    });
  });

  it('should store and retrieve tenantId', () => {
    RequestContext.run(() => {
      RequestContext.set('tenantId', 'tenant-456');
      expect(RequestContext.tenantId).toBe('tenant-456');
    });
  });

  it('should store and retrieve userId', () => {
    RequestContext.run(() => {
      RequestContext.set('userId', 'user-789');
      expect(RequestContext.userId).toBe('user-789');
    });
  });

  it('should return undefined when no store is active', () => {
    expect(RequestContext.traceId).toBeUndefined();
    expect(RequestContext.tenantId).toBeUndefined();
    expect(RequestContext.userId).toBeUndefined();
  });

  it('should isolate values between different runs', () => {
    RequestContext.run(() => {
      RequestContext.set('traceId', 'run-1');
      expect(RequestContext.traceId).toBe('run-1');
    });

    RequestContext.run(() => {
      expect(RequestContext.traceId).toBeUndefined();
      RequestContext.set('traceId', 'run-2');
      expect(RequestContext.traceId).toBe('run-2');
    });
  });

  it('should store and retrieve arbitrary keys', () => {
    RequestContext.run(() => {
      RequestContext.set('customKey', { foo: 'bar' });
      expect(RequestContext.get('customKey')).toEqual({ foo: 'bar' });
    });
  });

  it('should preserve context across async boundaries', async () => {
    await new Promise<void>((resolve) => {
      RequestContext.run(() => {
        RequestContext.set('traceId', 'async-trace');

        setTimeout(() => {
          expect(RequestContext.traceId).toBe('async-trace');
          resolve();
        }, 10);
      });
    });
  });

  it('should not set values when no store is active', () => {
    // Should not throw
    RequestContext.set('traceId', 'no-store');
    expect(RequestContext.traceId).toBeUndefined();
  });
});
