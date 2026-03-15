import { RequestLoggingMiddleware } from './request-logging.middleware';
import { AppLoggerService } from '../services/logger.service';
import { RequestContext } from '../services/request-context';
import { Request, Response } from 'express';
import { EventEmitter } from 'events';

describe('RequestLoggingMiddleware', () => {
  let middleware: RequestLoggingMiddleware;
  let logger: AppLoggerService;
  let logSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    logger = new AppLoggerService({ level: 'verbose', isProduction: true });
    // Mock the pino methods through the logger
    logSpy = jest.spyOn(logger, 'log').mockImplementation(() => {});
    warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(logger, 'error').mockImplementation(() => {});
    middleware = new RequestLoggingMiddleware(logger);
  });

  function createMockReq(overrides: Partial<Request> = {}): Partial<Request> {
    return {
      method: 'GET',
      originalUrl: '/api/v1/tenants',
      url: '/api/v1/tenants',
      path: '/api/v1/tenants',
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'test-agent',
        host: 'localhost',
      },
      socket: { remoteAddress: '127.0.0.1' } as any,
      ...overrides,
    };
  }

  function createMockRes(): EventEmitter & Partial<Response> {
    const res = new EventEmitter() as EventEmitter & Partial<Response>;
    res.statusCode = 200;
    return res;
  }

  it('should log request with method, URL, status code, and duration', (done) => {
    const req = createMockReq();
    const res = createMockRes();

    middleware.use(req as Request, res as Response, () => {
      res.statusCode = 200;
      res.emit('finish');

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('HTTP GET /api/v1/tenants 200'),
        expect.objectContaining({
          method: 'GET',
          url: '/api/v1/tenants',
          statusCode: 200,
          duration: expect.any(Number),
        }),
      );
      done();
    });
  });

  it('should log 4xx responses as warn', (done) => {
    const req = createMockReq();
    const res = createMockRes();

    middleware.use(req as Request, res as Response, () => {
      res.statusCode = 404;
      res.emit('finish');

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('404'),
        expect.objectContaining({ statusCode: 404 }),
      );
      done();
    });
  });

  it('should log 5xx responses as error', (done) => {
    const req = createMockReq();
    const res = createMockRes();

    middleware.use(req as Request, res as Response, () => {
      res.statusCode = 500;
      res.emit('finish');

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('500'),
        expect.objectContaining({ statusCode: 500 }),
      );
      done();
    });
  });

  it('should skip /health endpoint', () => {
    const req = createMockReq({ path: '/health' });
    const res = createMockRes();
    const next = jest.fn();

    middleware.use(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    res.emit('finish');
    expect(logSpy).not.toHaveBeenCalled();
  });

  it('should skip /api/v1/health endpoint', () => {
    const req = createMockReq({ path: '/api/v1/health' });
    const res = createMockRes();
    const next = jest.fn();

    middleware.use(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    res.emit('finish');
    expect(logSpy).not.toHaveBeenCalled();
  });

  it('should redact Authorization header', (done) => {
    const req = createMockReq({
      headers: {
        'user-agent': 'test-agent',
        authorization: 'Bearer secret-token',
        host: 'localhost',
      },
    });
    const res = createMockRes();

    middleware.use(req as Request, res as Response, () => {
      res.emit('finish');

      expect(logSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            authorization: '[REDACTED]',
          }),
        }),
      );
      done();
    });
  });

  it('should redact Cookie header', (done) => {
    const req = createMockReq({
      headers: {
        'user-agent': 'test-agent',
        cookie: 'session=abc123',
        host: 'localhost',
      },
    });
    const res = createMockRes();

    middleware.use(req as Request, res as Response, () => {
      res.emit('finish');

      expect(logSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            cookie: '[REDACTED]',
          }),
        }),
      );
      done();
    });
  });

  it('should include userAgent and ip in log data', (done) => {
    const req = createMockReq({
      ip: '192.168.1.1',
      headers: { 'user-agent': 'Mozilla/5.0', host: 'localhost' },
    });
    const res = createMockRes();

    middleware.use(req as Request, res as Response, () => {
      res.emit('finish');

      expect(logSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          userAgent: 'Mozilla/5.0',
          ip: '192.168.1.1',
        }),
      );
      done();
    });
  });

  it('should include traceId from RequestContext', (done) => {
    const req = createMockReq();
    const res = createMockRes();

    RequestContext.run(() => {
      RequestContext.set('traceId', 'test-trace-id');

      middleware.use(req as Request, res as Response, () => {
        res.emit('finish');

        expect(logSpy).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            traceId: 'test-trace-id',
          }),
        );
        done();
      });
    });
  });

  it('should capture duration in milliseconds', (done) => {
    const req = createMockReq();
    const res = createMockRes();

    middleware.use(req as Request, res as Response, () => {
      // Small delay to ensure duration > 0
      setTimeout(() => {
        res.emit('finish');

        expect(logSpy).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            duration: expect.any(Number),
          }),
        );
        done();
      }, 5);
    });
  });
});
