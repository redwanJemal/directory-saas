import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AppException } from '../exceptions/app.exception';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  describe('canActivate', () => {
    it('should allow access for @Public() routes', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const context = {
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;

      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('handleRequest', () => {
    it('should return user when present', () => {
      const user = { sub: '1', userType: 'admin', email: 'a@b.com' };
      expect(guard.handleRequest(null, user, undefined)).toBe(user);
    });

    it('should throw UNAUTHORIZED when no user', () => {
      expect(() => guard.handleRequest(null, null, undefined)).toThrow(AppException);
    });

    it('should throw TOKEN_EXPIRED for expired tokens', () => {
      const expiredError = new Error('jwt expired');
      expiredError.name = 'TokenExpiredError';

      try {
        guard.handleRequest(null, null, expiredError);
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(AppException);
        expect((e as AppException).errorCode).toBe('TOKEN_EXPIRED');
      }
    });

    it('should throw UNAUTHORIZED for other errors', () => {
      const error = new Error('bad token');

      try {
        guard.handleRequest(error, null, undefined);
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(AppException);
        expect((e as AppException).errorCode).toBe('UNAUTHORIZED');
      }
    });
  });
});
