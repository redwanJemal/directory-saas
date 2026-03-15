import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppException } from '../exceptions/app.exception';
import { ErrorCodes, ErrorCodeHttpStatus } from '../constants/error-codes';
import { RequestContext } from '../services/request-context';

interface PrismaClientKnownRequestError {
  code: string;
  meta?: Record<string, unknown>;
  message: string;
  name: string;
}

function isPrismaKnownError(
  error: unknown,
): error is PrismaClientKnownRequestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'name' in error &&
    (error as PrismaClientKnownRequestError).name ===
      'PrismaClientKnownRequestError'
  );
}

const PRISMA_ERROR_MAP: Record<
  string,
  { code: string; message: string; status: number }
> = {
  P2002: {
    code: ErrorCodes.ALREADY_EXISTS,
    message: 'A record with this value already exists',
    status: 409,
  },
  P2025: {
    code: ErrorCodes.NOT_FOUND,
    message: 'Record not found',
    status: 404,
  },
  P2003: {
    code: ErrorCodes.CONFLICT,
    message: 'Related record not found',
    status: 409,
  },
  P2014: {
    code: ErrorCodes.CONFLICT,
    message: 'This change would violate a required relation',
    status: 409,
  },
};

function mapHttpStatusToErrorCode(status: number): string {
  if (status === 400) return ErrorCodes.INVALID_INPUT;
  if (status === 401) return ErrorCodes.UNAUTHORIZED;
  if (status === 403) return ErrorCodes.FORBIDDEN;
  if (status === 404) return ErrorCodes.NOT_FOUND;
  if (status === 409) return ErrorCodes.CONFLICT;
  if (status === 429) return ErrorCodes.RATE_LIMIT_EXCEEDED;
  return ErrorCodes.INTERNAL_ERROR;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);
  private readonly isProduction = process.env.NODE_ENV === 'production';

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const traceId =
      RequestContext.traceId ||
      (request.headers['x-correlation-id'] as string) ||
      (request.headers['x-request-id'] as string) ||
      '';

    const { status, body } = this.buildResponse(exception, traceId);

    this.logError(exception, request, status);

    response.status(status).json(body);
  }

  private buildResponse(
    exception: unknown,
    traceId: string,
  ): {
    status: number;
    body: Record<string, unknown>;
  } {
    // 1. AppException
    if (exception instanceof AppException) {
      const exResponse = exception.getResponse() as {
        errorCode: string;
        message: string;
        details?: unknown;
      };
      return {
        status: exception.getStatus(),
        body: this.formatError(
          exResponse.errorCode,
          exResponse.message,
          traceId,
          exResponse.details,
        ),
      };
    }

    // 2. ZodError
    if (exception instanceof ZodError) {
      const details = exception.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return {
        status: ErrorCodeHttpStatus[ErrorCodes.VALIDATION_ERROR],
        body: this.formatError(
          ErrorCodes.VALIDATION_ERROR,
          'Validation failed',
          traceId,
          details,
        ),
      };
    }

    // 3. NestJS HttpException (but not AppException)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exResponse = exception.getResponse();
      const message =
        typeof exResponse === 'string'
          ? exResponse
          : (exResponse as Record<string, unknown>).message ||
            exception.message;
      const displayMessage = Array.isArray(message)
        ? message.join(', ')
        : String(message);
      const code = mapHttpStatusToErrorCode(status);
      return {
        status,
        body: this.formatError(code, displayMessage, traceId),
      };
    }

    // 4. Prisma known errors
    if (isPrismaKnownError(exception)) {
      const mapped = PRISMA_ERROR_MAP[exception.code];
      if (mapped) {
        const details =
          exception.code === 'P2002' && exception.meta?.target
            ? {
                fields: exception.meta.target,
              }
            : undefined;
        return {
          status: mapped.status,
          body: this.formatError(
            mapped.code,
            mapped.message,
            traceId,
            details,
          ),
        };
      }
    }

    // 5. Unknown errors
    return {
      status: 500,
      body: this.formatError(
        ErrorCodes.INTERNAL_ERROR,
        'An unexpected error occurred',
        traceId,
      ),
    };
  }

  private formatError(
    code: string,
    message: string,
    traceId: string,
    details?: unknown,
  ): Record<string, unknown> {
    const error: Record<string, unknown> = { code, message };
    if (details !== undefined) {
      error.details = details;
    }
    return {
      success: false,
      error,
      timestamp: new Date().toISOString(),
      traceId,
    };
  }

  private logError(
    exception: unknown,
    request: Request,
    status: number,
  ): void {
    const context = {
      method: request.method,
      url: request.url,
      status,
    };

    if (status >= 500) {
      this.logger.error(
        `${context.method} ${context.url} ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
        context,
      );
    } else {
      const message =
        exception instanceof Error ? exception.message : String(exception);
      this.logger.warn(`${context.method} ${context.url} ${status} - ${message}`);
    }
  }
}
