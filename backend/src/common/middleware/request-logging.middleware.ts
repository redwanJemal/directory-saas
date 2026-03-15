import { Injectable, NestMiddleware, Inject } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AppLoggerService } from '../services/logger.service';
import { RequestContext } from '../services/request-context';

const SKIP_PATHS = ['/health', '/api/v1/health'];

const REDACTED_HEADERS = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
]);

function redactHeaders(
  headers: Record<string, unknown>,
): Record<string, unknown> {
  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(headers)) {
    redacted[key] = REDACTED_HEADERS.has(key.toLowerCase())
      ? '[REDACTED]'
      : value;
  }
  return redacted;
}

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  constructor(
    @Inject(AppLoggerService) private readonly logger: AppLoggerService,
  ) {}

  use(req: Request, res: Response, next: NextFunction): void {
    // Skip health check endpoints
    if (SKIP_PATHS.includes(req.path)) {
      next();
      return;
    }

    const startTime = Date.now();

    // Log on response finish
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;
      const method = req.method;
      const url = req.originalUrl || req.url;
      const traceId = RequestContext.traceId;

      const logData: Record<string, unknown> = {
        traceId,
        method,
        url,
        statusCode,
        duration,
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.socket.remoteAddress,
        headers: redactHeaders(req.headers as Record<string, unknown>),
      };

      const message = `HTTP ${method} ${url} ${statusCode} ${duration}ms`;

      if (statusCode >= 500) {
        this.logger.error(message, logData);
      } else if (statusCode >= 400) {
        this.logger.warn(message, logData);
      } else {
        this.logger.log(message, logData);
      }
    });

    next();
  }
}
