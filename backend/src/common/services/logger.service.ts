import { LoggerService as NestLoggerService, Injectable } from '@nestjs/common';
import pino, { Logger as PinoLogger } from 'pino';
import { RequestContext } from './request-context';

const NEST_TO_PINO_LEVEL: Record<string, string> = {
  error: 'error',
  warn: 'warn',
  log: 'info',
  debug: 'debug',
  verbose: 'trace',
};

function pinoLevel(nestLevel: string): string {
  return NEST_TO_PINO_LEVEL[nestLevel] || 'info';
}

export interface LoggerOptions {
  level?: string;
  isProduction?: boolean;
}

@Injectable()
export class AppLoggerService implements NestLoggerService {
  private readonly pino: PinoLogger;

  constructor(options: LoggerOptions = {}) {
    const level = pinoLevel(options.level || 'log');
    const isProduction = options.isProduction ?? process.env.NODE_ENV === 'production';

    if (isProduction) {
      this.pino = pino({
        level,
        formatters: {
          level(label: string) {
            return { level: label };
          },
        },
        timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
      });
    } else {
      this.pino = pino({
        level,
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
            ignore: 'pid,hostname',
          },
        },
      });
    }
  }

  log(message: string, ...optionalParams: unknown[]): void {
    this.writeLog('info', message, optionalParams);
  }

  error(message: string, ...optionalParams: unknown[]): void {
    this.writeLog('error', message, optionalParams);
  }

  warn(message: string, ...optionalParams: unknown[]): void {
    this.writeLog('warn', message, optionalParams);
  }

  debug(message: string, ...optionalParams: unknown[]): void {
    this.writeLog('debug', message, optionalParams);
  }

  verbose(message: string, ...optionalParams: unknown[]): void {
    this.writeLog('trace', message, optionalParams);
  }

  private writeLog(level: string, message: string, optionalParams: unknown[]): void {
    const contextObj = this.buildContextObject(optionalParams);
    const logFn = this.pino[level as 'info' | 'error' | 'warn' | 'debug' | 'trace'];
    if (typeof logFn === 'function') {
      logFn.call(this.pino, contextObj, message);
    }
  }

  private buildContextObject(optionalParams: unknown[]): Record<string, unknown> {
    const obj: Record<string, unknown> = {};

    // Attach request context if available
    const traceId = RequestContext.traceId;
    if (traceId) obj.traceId = traceId;

    const tenantId = RequestContext.tenantId;
    if (tenantId) obj.tenantId = tenantId;

    const userId = RequestContext.userId;
    if (userId) obj.userId = userId;

    // Process optional params
    for (const param of optionalParams) {
      if (typeof param === 'string') {
        obj.context = param;
      } else if (param instanceof Error) {
        obj.err = {
          message: param.message,
          stack: param.stack,
          name: param.name,
        };
      } else if (typeof param === 'object' && param !== null) {
        Object.assign(obj, param);
      }
    }

    return obj;
  }

  /**
   * Get the underlying pino instance for advanced usage (e.g., request logging middleware).
   */
  getPino(): PinoLogger {
    return this.pino;
  }
}
