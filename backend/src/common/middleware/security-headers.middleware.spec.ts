import { SecurityHeadersMiddleware } from './security-headers.middleware';
import { Request, Response } from 'express';

describe('SecurityHeadersMiddleware', () => {
  let middleware: SecurityHeadersMiddleware;

  beforeEach(() => {
    middleware = new SecurityHeadersMiddleware();
  });

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

  it('should set X-Content-Type-Options to nosniff', (done) => {
    const res = createMockRes();
    middleware.use({} as Request, res as Response, () => {
      expect(res.setHeader).toHaveBeenCalledWith(
        'X-Content-Type-Options',
        'nosniff',
      );
      done();
    });
  });

  it('should set X-Frame-Options to DENY', (done) => {
    const res = createMockRes();
    middleware.use({} as Request, res as Response, () => {
      expect(res.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
      done();
    });
  });

  it('should set X-XSS-Protection to 0', (done) => {
    const res = createMockRes();
    middleware.use({} as Request, res as Response, () => {
      expect(res.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '0');
      done();
    });
  });

  it('should set Referrer-Policy to strict-origin-when-cross-origin', (done) => {
    const res = createMockRes();
    middleware.use({} as Request, res as Response, () => {
      expect(res.setHeader).toHaveBeenCalledWith(
        'Referrer-Policy',
        'strict-origin-when-cross-origin',
      );
      done();
    });
  });

  it('should set Permissions-Policy', (done) => {
    const res = createMockRes();
    middleware.use({} as Request, res as Response, () => {
      expect(res.setHeader).toHaveBeenCalledWith(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=()',
      );
      done();
    });
  });

  it('should call next()', (done) => {
    const res = createMockRes();
    middleware.use({} as Request, res as Response, () => {
      done();
    });
  });
});
