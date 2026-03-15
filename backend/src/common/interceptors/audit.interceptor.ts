import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';
import { RequestContext } from '../services/request-context';
import { AUDITED_KEY, AuditedOptions } from '../decorators/audited.decorator';
import { AuditService } from '../../modules/audit/audit.service';
import { AuditAction } from '../../modules/audit/dto';

const METHOD_TO_ACTION: Record<string, AuditAction> = {
  POST: 'CREATE',
  PATCH: 'UPDATE',
  PUT: 'UPDATE',
  DELETE: 'DELETE',
};

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const auditedOptions = this.reflector.getAllAndOverride<AuditedOptions | undefined>(
      AUDITED_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Skip if handler is not decorated with @Audited()
    if (auditedOptions === undefined) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method.toUpperCase();
    const action = METHOD_TO_ACTION[method];

    // Skip non-write methods
    if (!action) {
      return next.handle();
    }

    const params = request.params as Record<string, string>;
    const entity = auditedOptions.entity || extractEntity(request.path, params);
    const entityId = extractEntityId(params);
    const tenantId = RequestContext.tenantId || extractTenantIdFromParams(params);
    const userId = (request as any).user?.sub || RequestContext.userId;
    const userType = (request as any).user?.userType;
    const ipAddress = request.ip || request.socket?.remoteAddress;
    const userAgent = request.headers['user-agent'];

    const metadata = {
      ipAddress,
      userAgent,
      method: request.method,
      url: request.originalUrl,
    };

    return next.handle().pipe(
      tap({
        next: (responseData) => {
          // Fire-and-forget: don't block the response
          const newData = action === 'DELETE' ? undefined : extractResponseData(responseData);
          this.auditService
            .log({
              tenantId,
              userId,
              userType,
              action,
              entity,
              entityId: entityId || extractIdFromResponse(responseData),
              oldData: undefined, // oldData requires pre-fetch which we skip for simplicity
              newData: newData as Record<string, unknown> | undefined,
              metadata,
              ipAddress,
              userAgent,
            })
            .catch(() => {
              // Audit logging should never break the request
            });
        },
      }),
    );
  }
}

function extractEntity(path: string, params: Record<string, string>): string {
  // /api/v1/tenants/:tenantId/users/:id → 'users'
  // /api/v1/admin/tenants → 'tenants'
  const paramValues = new Set(Object.values(params));
  const segments = path
    .replace(/^\/api\/v\d+\/?/, '')
    .split('/')
    .filter(Boolean);

  // Walk backwards to find the last segment that isn't a param value or 'admin'
  for (let i = segments.length - 1; i >= 0; i--) {
    const seg = segments[i];
    if (!paramValues.has(seg) && !isUuidLike(seg) && seg !== 'admin') {
      return seg;
    }
  }

  return segments[0] || 'unknown';
}

function isUuidLike(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

function extractEntityId(params: Record<string, string>): string | undefined {
  return params?.id || params?.entityId;
}

function extractTenantIdFromParams(params: Record<string, string>): string | undefined {
  return params?.tenantId;
}

function extractResponseData(response: unknown): unknown {
  if (response === null || response === undefined) return undefined;
  if (typeof response !== 'object') return undefined;
  // If the response is wrapped by TransformInterceptor, extract the data
  const res = response as Record<string, unknown>;
  if ('data' in res && 'success' in res) {
    return res.data;
  }
  return response;
}

function extractIdFromResponse(response: unknown): string | undefined {
  if (response === null || response === undefined) return undefined;
  if (typeof response !== 'object') return undefined;
  const res = response as Record<string, unknown>;
  if (typeof res.id === 'string') return res.id;
  return undefined;
}
