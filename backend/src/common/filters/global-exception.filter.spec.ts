import {
  HttpException,
  HttpStatus,
  ArgumentsHost,
  Logger,
} from '@nestjs/common';
import { ZodError, ZodIssueCode } from 'zod';
import { GlobalExceptionFilter } from './global-exception.filter';
import { AppException } from '../exceptions/app.exception';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockResponse: {
    status: jest.Mock;
    json: jest.Mock;
  };
  let mockRequest: {
    method: string;
    url: string;
    headers: Record<string, string>;
  };
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockRequest = {
      method: 'GET',
      url: '/api/v1/test',
      headers: { 'x-correlation-id': 'trace-123' },
    };
    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;

    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('AppException handling', () => {
    it('should format AppException with correct status and error code', () => {
      const exception = new AppException('NOT_FOUND', 'User not found');

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      const body = mockResponse.json.mock.calls[0][0];
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('NOT_FOUND');
      expect(body.error.message).toBe('User not found');
      expect(body.traceId).toBe('trace-123');
      expect(body.timestamp).toBeDefined();
    });

    it('should include details from AppException', () => {
      const details = [{ field: 'email', message: 'Invalid' }];
      const exception = new AppException(
        'VALIDATION_ERROR',
        'Validation failed',
        details,
      );

      filter.catch(exception, mockHost);

      const body = mockResponse.json.mock.calls[0][0];
      expect(body.error.details).toEqual(details);
    });
  });

  describe('ZodError handling', () => {
    it('should format ZodError as VALIDATION_ERROR with field-level details', () => {
      const zodError = new ZodError([
        {
          code: ZodIssueCode.invalid_type,
          expected: 'string',
          received: 'number',
          path: ['email'],
          message: 'Expected string, received number',
        },
        {
          code: ZodIssueCode.too_small,
          minimum: 2,
          type: 'string',
          inclusive: true,
          exact: false,
          path: ['name'],
          message: 'String must contain at least 2 character(s)',
        },
      ]);

      filter.catch(zodError, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      const body = mockResponse.json.mock.calls[0][0];
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.message).toBe('Validation failed');
      expect(body.error.details).toEqual([
        { field: 'email', message: 'Expected string, received number' },
        {
          field: 'name',
          message: 'String must contain at least 2 character(s)',
        },
      ]);
    });

    it('should handle nested path in ZodError', () => {
      const zodError = new ZodError([
        {
          code: ZodIssueCode.invalid_type,
          expected: 'string',
          received: 'undefined',
          path: ['address', 'city'],
          message: 'Required',
        },
      ]);

      filter.catch(zodError, mockHost);

      const body = mockResponse.json.mock.calls[0][0];
      expect(body.error.details[0].field).toBe('address.city');
    });
  });

  describe('HttpException handling', () => {
    it('should format NestJS HttpException with mapped error code', () => {
      const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      const body = mockResponse.json.mock.calls[0][0];
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('FORBIDDEN');
    });

    it('should handle HttpException with object response', () => {
      const exception = new HttpException(
        { message: 'Not Found', statusCode: 404 },
        HttpStatus.NOT_FOUND,
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      const body = mockResponse.json.mock.calls[0][0];
      expect(body.error.code).toBe('NOT_FOUND');
      expect(body.error.message).toBe('Not Found');
    });

    it('should handle HttpException with array message', () => {
      const exception = new HttpException(
        { message: ['Error one', 'Error two'] },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockHost);

      const body = mockResponse.json.mock.calls[0][0];
      expect(body.error.message).toBe('Error one, Error two');
    });
  });

  describe('Prisma error handling', () => {
    it('should map P2002 unique constraint violation to ALREADY_EXISTS (409)', () => {
      const prismaError = {
        name: 'PrismaClientKnownRequestError',
        code: 'P2002',
        meta: { target: ['email'] },
        message: 'Unique constraint failed on the fields: (`email`)',
      };

      filter.catch(prismaError, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      const body = mockResponse.json.mock.calls[0][0];
      expect(body.error.code).toBe('ALREADY_EXISTS');
      expect(body.error.details).toEqual({ fields: ['email'] });
    });

    it('should map P2025 record not found to NOT_FOUND (404)', () => {
      const prismaError = {
        name: 'PrismaClientKnownRequestError',
        code: 'P2025',
        meta: {},
        message: 'Record to update not found.',
      };

      filter.catch(prismaError, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      const body = mockResponse.json.mock.calls[0][0];
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('should map P2003 foreign key violation to CONFLICT (409)', () => {
      const prismaError = {
        name: 'PrismaClientKnownRequestError',
        code: 'P2003',
        meta: {},
        message: 'Foreign key constraint failed',
      };

      filter.catch(prismaError, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      const body = mockResponse.json.mock.calls[0][0];
      expect(body.error.code).toBe('CONFLICT');
    });
  });

  describe('Unknown error handling', () => {
    it('should return 500 with INTERNAL_ERROR for unknown errors', () => {
      const error = new Error('Something broke');

      filter.catch(error, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      const body = mockResponse.json.mock.calls[0][0];
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INTERNAL_ERROR');
      expect(body.error.message).toBe('An unexpected error occurred');
    });

    it('should not expose stack traces in the response', () => {
      const error = new Error('Database connection failed');
      error.stack = 'Error: Database connection failed\n    at Object.<anonymous>';

      filter.catch(error, mockHost);

      const body = mockResponse.json.mock.calls[0][0];
      expect(JSON.stringify(body)).not.toContain('at Object');
      expect(JSON.stringify(body)).not.toContain('Database connection failed');
    });

    it('should log the full error for 500 errors', () => {
      const error = new Error('Internal failure');

      filter.catch(error, mockHost);

      expect(Logger.prototype.error).toHaveBeenCalled();
    });
  });

  describe('traceId', () => {
    it('should use x-correlation-id header as traceId', () => {
      mockRequest.headers = { 'x-correlation-id': 'corr-456' };
      filter.catch(new Error('test'), mockHost);

      const body = mockResponse.json.mock.calls[0][0];
      expect(body.traceId).toBe('corr-456');
    });

    it('should fall back to x-request-id header', () => {
      mockRequest.headers = { 'x-request-id': 'req-789' };
      filter.catch(new Error('test'), mockHost);

      const body = mockResponse.json.mock.calls[0][0];
      expect(body.traceId).toBe('req-789');
    });

    it('should use empty string when no trace header present', () => {
      mockRequest.headers = {};
      filter.catch(new Error('test'), mockHost);

      const body = mockResponse.json.mock.calls[0][0];
      expect(body.traceId).toBe('');
    });
  });
});
