import { AppException } from '../exceptions/app.exception';
import { ServiceResult } from './index';

describe('ServiceResult', () => {
  describe('ok', () => {
    it('should create a successful result with data', () => {
      const data = { id: '123', name: 'Test' };
      const result = ServiceResult.ok(data);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
      expect(result.error).toBeUndefined();
    });

    it('should handle null data', () => {
      const result = ServiceResult.ok(null);

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('should handle array data', () => {
      const data = [1, 2, 3];
      const result = ServiceResult.ok(data);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([1, 2, 3]);
    });
  });

  describe('fail', () => {
    it('should create a failed result with error code and message', () => {
      const result = ServiceResult.fail('NOT_FOUND', 'Resource not found');

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.error).toEqual({
        code: 'NOT_FOUND',
        message: 'Resource not found',
      });
    });

    it('should include details when provided', () => {
      const details = [{ field: 'email', message: 'Invalid email' }];
      const result = ServiceResult.fail('VALIDATION_ERROR', 'Validation failed', details);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details,
      });
    });
  });

  describe('toHttpException', () => {
    it('should return AppException for NOT_FOUND', () => {
      const result = ServiceResult.fail('NOT_FOUND', 'Not found');
      const exception = result.toHttpException();

      expect(exception).toBeInstanceOf(AppException);
      expect(exception.getStatus()).toBe(404);
      expect(exception.errorCode).toBe('NOT_FOUND');
    });

    it('should map UNAUTHORIZED to 401', () => {
      const result = ServiceResult.fail('UNAUTHORIZED', 'Unauthorized');
      const exception = result.toHttpException();

      expect(exception.getStatus()).toBe(401);
    });

    it('should map VALIDATION_ERROR to 400', () => {
      const result = ServiceResult.fail('VALIDATION_ERROR', 'Bad input');
      const exception = result.toHttpException();

      expect(exception.getStatus()).toBe(400);
    });

    it('should map ALREADY_EXISTS to 409', () => {
      const result = ServiceResult.fail('ALREADY_EXISTS', 'Already exists');
      const exception = result.toHttpException();

      expect(exception.getStatus()).toBe(409);
    });

    it('should map RATE_LIMIT_EXCEEDED to 429', () => {
      const result = ServiceResult.fail('RATE_LIMIT_EXCEEDED', 'Too many requests');
      const exception = result.toHttpException();

      expect(exception.getStatus()).toBe(429);
    });

    it('should map PLAN_LIMIT_REACHED to 403', () => {
      const result = ServiceResult.fail('PLAN_LIMIT_REACHED', 'Upgrade required');
      const exception = result.toHttpException();

      expect(exception.getStatus()).toBe(403);
    });

    it('should default to 500 for unknown codes', () => {
      const result = ServiceResult.fail('UNKNOWN_CODE', 'Something went wrong');
      const exception = result.toHttpException();

      expect(exception.getStatus()).toBe(500);
    });

    it('should return INTERNAL_ERROR when called on a successful result', () => {
      const result = ServiceResult.ok('data');
      const exception = result.toHttpException();

      expect(exception.getStatus()).toBe(500);
      expect(exception.errorCode).toBe('INTERNAL_ERROR');
    });

    it('should include error details in the exception', () => {
      const details = [{ field: 'email', message: 'Invalid' }];
      const result = ServiceResult.fail('VALIDATION_ERROR', 'Validation failed', details);
      const exception = result.toHttpException();

      expect(exception.errorCode).toBe('VALIDATION_ERROR');
      expect(exception.details).toEqual(details);
    });
  });
});
