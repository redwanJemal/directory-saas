import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { RequestContext } from '../services/request-context';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const correlationId =
      (req.headers['x-correlation-id'] as string) || randomUUID();

    // Set on request for downstream access
    req.headers['x-correlation-id'] = correlationId;

    // Set response header
    res.setHeader('X-Correlation-ID', correlationId);

    // Run the rest of the request inside AsyncLocalStorage context
    RequestContext.run(() => {
      RequestContext.set('traceId', correlationId);
      next();
    });
  }
}
