import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestContext } from '../services/request-context';
import { AppException } from '../exceptions/app.exception';

export const CurrentTenant = createParamDecorator(
  (_data: unknown, _ctx: ExecutionContext): string => {
    const tenantId = RequestContext.tenantId;
    if (!tenantId) {
      throw new AppException(
        'TENANT_REQUIRED',
        'Tenant context is required',
      );
    }
    return tenantId;
  },
);
