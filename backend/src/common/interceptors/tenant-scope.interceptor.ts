import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { RequestContext } from '../services/request-context';

const WRITE_METHODS = new Set(['POST', 'PATCH', 'PUT']);

@Injectable()
export class TenantScopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();

    if (WRITE_METHODS.has(request.method) && request.body) {
      const tenantId = RequestContext.tenantId;
      if (tenantId && !request.body.tenantId) {
        request.body.tenantId = tenantId;
      }
    }

    return next.handle();
  }
}
