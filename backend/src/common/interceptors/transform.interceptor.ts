import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Request } from 'express';
import { PaginatedResult } from '../dto/pagination.dto';
import { RequestContext } from '../services/request-context';

function isPaginatedResult(value: unknown): value is PaginatedResult<unknown> {
  return (
    value instanceof PaginatedResult ||
    (typeof value === 'object' &&
      value !== null &&
      'items' in value &&
      'total' in value &&
      'page' in value &&
      'pageSize' in value)
  );
}

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const traceId =
      RequestContext.traceId ||
      (request.headers['x-correlation-id'] as string) ||
      (request.headers['x-request-id'] as string) ||
      '';

    return next.handle().pipe(
      map((data) => {
        // Don't wrap null/undefined (204 No Content)
        if (data === null || data === undefined) {
          return data;
        }

        const timestamp = new Date().toISOString();

        if (isPaginatedResult(data)) {
          return {
            success: true,
            data: data.items,
            pagination: {
              page: data.page,
              pageSize: data.pageSize,
              totalCount: data.total,
              totalPages: data.totalPages,
            },
            timestamp,
            traceId,
          };
        }

        return {
          success: true,
          data,
          timestamp,
          traceId,
        };
      }),
    );
  }
}
