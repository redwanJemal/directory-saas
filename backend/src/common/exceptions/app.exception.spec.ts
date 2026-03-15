import { HttpException } from '@nestjs/common';
import { AppException } from './app.exception';
import { ErrorCodes, ErrorCodeHttpStatus } from '../constants/error-codes';

describe('AppException', () => {
  it('should extend HttpException', () => {
    const exception = new AppException('NOT_FOUND', 'Not found');
    expect(exception).toBeInstanceOf(HttpException);
  });

  it('should store errorCode and message', () => {
    const exception = new AppException('NOT_FOUND', 'Resource not found');
    expect(exception.errorCode).toBe('NOT_FOUND');
    expect(exception.getStatus()).toBe(404);
  });

  it('should store details', () => {
    const details = [{ field: 'email', message: 'Invalid' }];
    const exception = new AppException('VALIDATION_ERROR', 'Validation failed', details);
    expect(exception.details).toEqual(details);
  });

  it('should allow custom status code override', () => {
    const exception = new AppException('NOT_FOUND', 'Custom status', undefined, 422);
    expect(exception.getStatus()).toBe(422);
  });

  it('should default to 500 for unknown error codes', () => {
    const exception = new AppException('UNKNOWN_CODE', 'Unknown');
    expect(exception.getStatus()).toBe(500);
  });

  it.each(Object.entries(ErrorCodeHttpStatus))(
    'should map %s to HTTP %i',
    (code, expectedStatus) => {
      const exception = new AppException(code, `Test ${code}`);
      expect(exception.getStatus()).toBe(expectedStatus);
    },
  );

  it('should include errorCode, message, and details in response body', () => {
    const details = { fields: ['email'] };
    const exception = new AppException('ALREADY_EXISTS', 'Duplicate', details);
    const response = exception.getResponse() as Record<string, unknown>;

    expect(response.errorCode).toBe('ALREADY_EXISTS');
    expect(response.message).toBe('Duplicate');
    expect(response.details).toEqual(details);
  });
});
