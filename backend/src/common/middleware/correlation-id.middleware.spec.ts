import { CorrelationIdMiddleware } from './correlation-id.middleware';
import { RequestContext } from '../services/request-context';
import { Request, Response } from 'express';

describe('CorrelationIdMiddleware', () => {
  let middleware: CorrelationIdMiddleware;

  beforeEach(() => {
    middleware = new CorrelationIdMiddleware();
  });

  function createMockReq(headers: Record<string, string> = {}): Partial<Request> {
    return {
      headers: { ...headers },
    };
  }

  function createMockRes(): Partial<Response> {
    const headers: Record<string, string> = {};
    return {
      setHeader: jest.fn((key: string, value: string) => {
        headers[key] = value;
        return {} as Response;
      }),
      getHeader: jest.fn((key: string) => headers[key]),
    };
  }

  it('should generate a UUID v4 when no X-Correlation-ID header is provided', (done) => {
    const req = createMockReq();
    const res = createMockRes();

    middleware.use(req as Request, res as Response, () => {
      const traceId = RequestContext.traceId;
      expect(traceId).toBeDefined();
      expect(typeof traceId).toBe('string');
      // UUID v4 format
      expect(traceId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      expect(res.setHeader).toHaveBeenCalledWith('X-Correlation-ID', traceId);
      done();
    });
  });

  it('should use existing X-Correlation-ID header if provided', (done) => {
    const req = createMockReq({ 'x-correlation-id': 'existing-id-123' });
    const res = createMockRes();

    middleware.use(req as Request, res as Response, () => {
      expect(RequestContext.traceId).toBe('existing-id-123');
      expect(res.setHeader).toHaveBeenCalledWith(
        'X-Correlation-ID',
        'existing-id-123',
      );
      expect(req.headers!['x-correlation-id']).toBe('existing-id-123');
      done();
    });
  });

  it('should set the correlation ID on the request headers', (done) => {
    const req = createMockReq();
    const res = createMockRes();

    middleware.use(req as Request, res as Response, () => {
      expect(req.headers!['x-correlation-id']).toBeDefined();
      expect(typeof req.headers!['x-correlation-id']).toBe('string');
      done();
    });
  });

  it('should set the correlation ID in the response header', (done) => {
    const req = createMockReq();
    const res = createMockRes();

    middleware.use(req as Request, res as Response, () => {
      expect(res.setHeader).toHaveBeenCalledWith(
        'X-Correlation-ID',
        expect.any(String),
      );
      done();
    });
  });

  it('should store traceId in RequestContext AsyncLocalStorage', (done) => {
    const req = createMockReq({ 'x-correlation-id': 'trace-from-header' });
    const res = createMockRes();

    middleware.use(req as Request, res as Response, () => {
      expect(RequestContext.traceId).toBe('trace-from-header');
      done();
    });
  });
});
