import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerConfig, THROTTLER_CONFIG } from './throttler.guard';
import { RateLimitService, RateLimitResult } from '../services/rate-limit.service';
import { AppException } from '../exceptions/app.exception';
import { RequestContext } from '../services/request-context';
import { THROTTLE_KEY, SKIP_THROTTLE_KEY } from '../decorators/throttle.decorator';

describe('ThrottlerGuard', () => {
  let guard: ThrottlerGuard;
  let reflector: Reflector;
  let rateLimitService: jest.Mocked<RateLimitService>;
  let config: ThrottlerConfig;
  let mockRequest: Record<string, unknown>;
  let mockResponse: Record<string, jest.Mock>;
  let mockContext: ExecutionContext;

  const allowedResult: RateLimitResult = {
    allowed: true,
    limit: 100,
    remaining: 95,
    resetTime: Math.ceil(Date.now() / 1000) + 60,
  };

  const deniedResult: RateLimitResult = {
    allowed: false,
    limit: 100,
    remaining: 0,
    resetTime: Math.ceil(Date.now() / 1000) + 60,
    retryAfter: 30,
  };

  beforeEach(() => {
    reflector = new Reflector();
    rateLimitService = {
      check: jest.fn().mockResolvedValue(allowedResult),
    } as unknown as jest.Mocked<RateLimitService>;
    config = { limit: 100, ttl: 60 };

    mockRequest = {
      headers: {},
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' },
      user: undefined,
    };

    mockResponse = {
      setHeader: jest.fn(),
    };

    mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
      getHandler: () => function testHandler() {},
      getClass: () =>
        class TestController {},
    } as unknown as ExecutionContext;

    guard = new ThrottlerGuard(reflector, rateLimitService, config);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('canActivate', () => {
    it('should allow request within rate limit', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      jest.spyOn(RequestContext, 'tenantId', 'get').mockReturnValue(undefined);
      jest.spyOn(RequestContext, 'userId', 'get').mockReturnValue(undefined);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(rateLimitService.check).toHaveBeenCalledWith(
        'rl:ip:127.0.0.1',
        100,
        60,
      );
    });

    it('should throw AppException when rate limit exceeded', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      jest.spyOn(RequestContext, 'tenantId', 'get').mockReturnValue(undefined);
      jest.spyOn(RequestContext, 'userId', 'get').mockReturnValue(undefined);
      rateLimitService.check.mockResolvedValue(deniedResult);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        AppException,
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Retry-After',
        30,
      );
    });

    it('should set rate limit headers on response', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      jest.spyOn(RequestContext, 'tenantId', 'get').mockReturnValue(undefined);
      jest.spyOn(RequestContext, 'userId', 'get').mockReturnValue(undefined);

      await guard.canActivate(mockContext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Limit',
        100,
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Remaining',
        95,
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Reset',
        expect.any(Number),
      );
    });

    it('should skip rate limiting when @SkipThrottle() is present', async () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockImplementation((key: string) => {
          if (key === SKIP_THROTTLE_KEY) return true;
          return undefined;
        });

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(rateLimitService.check).not.toHaveBeenCalled();
    });

    it('should use @Throttle() override when present', async () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockImplementation((key: string) => {
          if (key === SKIP_THROTTLE_KEY) return undefined;
          if (key === THROTTLE_KEY) return { limit: 5, ttl: 30 };
          return undefined;
        });
      jest.spyOn(RequestContext, 'tenantId', 'get').mockReturnValue(undefined);
      jest.spyOn(RequestContext, 'userId', 'get').mockReturnValue(undefined);

      await guard.canActivate(mockContext);

      expect(rateLimitService.check).toHaveBeenCalledWith(
        expect.stringContaining('rl:custom:'),
        5,
        30,
      );
    });

    it('should use X-Forwarded-For for IP when behind proxy', async () => {
      mockRequest.headers = { 'x-forwarded-for': '203.0.113.50, 70.41.3.18' };
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      jest.spyOn(RequestContext, 'tenantId', 'get').mockReturnValue(undefined);
      jest.spyOn(RequestContext, 'userId', 'get').mockReturnValue(undefined);

      await guard.canActivate(mockContext);

      expect(rateLimitService.check).toHaveBeenCalledWith(
        'rl:ip:203.0.113.50',
        100,
        60,
      );
    });

    it('should apply stricter limits for auth endpoints', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      jest.spyOn(RequestContext, 'tenantId', 'get').mockReturnValue(undefined);
      jest.spyOn(RequestContext, 'userId', 'get').mockReturnValue(undefined);

      const authContext = {
        ...mockContext,
        getHandler: () => function adminLogin() {},
        getClass: () => {
          const cls = class AuthController {};
          return cls;
        },
      } as unknown as ExecutionContext;

      await guard.canActivate(authContext);

      expect(rateLimitService.check).toHaveBeenCalledWith(
        'rl:auth:127.0.0.1',
        10,
        60,
      );
    });

    it('should check tenant tier when tenantId is available', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      jest
        .spyOn(RequestContext, 'tenantId', 'get')
        .mockReturnValue('tenant-123');
      jest.spyOn(RequestContext, 'userId', 'get').mockReturnValue(undefined);

      await guard.canActivate(mockContext);

      expect(rateLimitService.check).toHaveBeenCalledTimes(2);
      expect(rateLimitService.check).toHaveBeenCalledWith(
        'rl:ip:127.0.0.1',
        100,
        60,
      );
      expect(rateLimitService.check).toHaveBeenCalledWith(
        'rl:tenant:tenant-123',
        1000,
        60,
      );
    });

    it('should check user tier when userId is available', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      jest.spyOn(RequestContext, 'tenantId', 'get').mockReturnValue(undefined);
      jest.spyOn(RequestContext, 'userId', 'get').mockReturnValue('user-456');

      await guard.canActivate(mockContext);

      expect(rateLimitService.check).toHaveBeenCalledTimes(2);
      expect(rateLimitService.check).toHaveBeenCalledWith(
        'rl:user:user-456',
        300,
        60,
      );
    });

    it('should check all three tiers when tenant and user available', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      jest
        .spyOn(RequestContext, 'tenantId', 'get')
        .mockReturnValue('tenant-123');
      jest.spyOn(RequestContext, 'userId', 'get').mockReturnValue('user-456');

      await guard.canActivate(mockContext);

      expect(rateLimitService.check).toHaveBeenCalledTimes(3);
    });

    it('should deny when any tier is exceeded', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      jest
        .spyOn(RequestContext, 'tenantId', 'get')
        .mockReturnValue('tenant-123');
      jest.spyOn(RequestContext, 'userId', 'get').mockReturnValue(undefined);

      // IP tier passes, tenant tier fails
      rateLimitService.check
        .mockResolvedValueOnce(allowedResult)
        .mockResolvedValueOnce(deniedResult);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        AppException,
      );
    });

    it('should set Retry-After header on 429', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      jest.spyOn(RequestContext, 'tenantId', 'get').mockReturnValue(undefined);
      jest.spyOn(RequestContext, 'userId', 'get').mockReturnValue(undefined);
      rateLimitService.check.mockResolvedValue(deniedResult);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        AppException,
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Retry-After',
        30,
      );
    });

    it('should use upload limits for upload endpoints', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      jest.spyOn(RequestContext, 'tenantId', 'get').mockReturnValue(undefined);
      jest.spyOn(RequestContext, 'userId', 'get').mockReturnValue('user-789');

      const uploadContext = {
        ...mockContext,
        getHandler: () => function uploadFile() {},
        getClass: () => {
          const cls = class UploadController {};
          return cls;
        },
      } as unknown as ExecutionContext;

      await guard.canActivate(uploadContext);

      expect(rateLimitService.check).toHaveBeenCalledWith(
        'rl:upload:user-789',
        20,
        60,
      );
    });
  });
});
