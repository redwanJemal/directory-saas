import { AppLoggerService } from './logger.service';
import { RequestContext } from './request-context';

describe('AppLoggerService', () => {
  describe('production mode (JSON output)', () => {
    let logger: AppLoggerService;

    beforeEach(() => {
      logger = new AppLoggerService({ level: 'log', isProduction: true });
    });

    it('should create logger in production mode without throwing', () => {
      expect(logger).toBeDefined();
    });

    it('should have a getPino method that returns a pino instance', () => {
      const pino = logger.getPino();
      expect(pino).toBeDefined();
      expect(typeof pino.info).toBe('function');
      expect(typeof pino.error).toBe('function');
      expect(typeof pino.warn).toBe('function');
    });
  });

  describe('development mode', () => {
    it('should create logger in development mode without throwing', () => {
      const logger = new AppLoggerService({ level: 'log', isProduction: false });
      expect(logger).toBeDefined();
    });
  });

  describe('log level mapping', () => {
    it('should default to info level when no level specified', () => {
      const logger = new AppLoggerService({ isProduction: true });
      const pino = logger.getPino();
      expect(pino.level).toBe('info');
    });

    it('should map "verbose" to pino "trace"', () => {
      const logger = new AppLoggerService({ level: 'verbose', isProduction: true });
      const pino = logger.getPino();
      expect(pino.level).toBe('trace');
    });

    it('should map "debug" to pino "debug"', () => {
      const logger = new AppLoggerService({ level: 'debug', isProduction: true });
      const pino = logger.getPino();
      expect(pino.level).toBe('debug');
    });

    it('should map "warn" to pino "warn"', () => {
      const logger = new AppLoggerService({ level: 'warn', isProduction: true });
      const pino = logger.getPino();
      expect(pino.level).toBe('warn');
    });

    it('should map "error" to pino "error"', () => {
      const logger = new AppLoggerService({ level: 'error', isProduction: true });
      const pino = logger.getPino();
      expect(pino.level).toBe('error');
    });
  });

  describe('logging methods', () => {
    let logger: AppLoggerService;
    let logSpy: jest.SpyInstance;
    let infoSpy: jest.SpyInstance;
    let warnSpy: jest.SpyInstance;
    let errorSpy: jest.SpyInstance;
    let debugSpy: jest.SpyInstance;
    let traceSpy: jest.SpyInstance;

    beforeEach(() => {
      logger = new AppLoggerService({ level: 'verbose', isProduction: true });
      const pino = logger.getPino();
      infoSpy = jest.spyOn(pino, 'info').mockImplementation(() => {});
      warnSpy = jest.spyOn(pino, 'warn').mockImplementation(() => {});
      errorSpy = jest.spyOn(pino, 'error').mockImplementation(() => {});
      debugSpy = jest.spyOn(pino, 'debug').mockImplementation(() => {});
      traceSpy = jest.spyOn(pino, 'trace').mockImplementation(() => {});
    });

    it('should call pino.info for log()', () => {
      logger.log('test message');
      expect(infoSpy).toHaveBeenCalledWith(expect.any(Object), 'test message');
    });

    it('should call pino.warn for warn()', () => {
      logger.warn('warning message');
      expect(warnSpy).toHaveBeenCalledWith(expect.any(Object), 'warning message');
    });

    it('should call pino.error for error()', () => {
      logger.error('error message');
      expect(errorSpy).toHaveBeenCalledWith(expect.any(Object), 'error message');
    });

    it('should call pino.debug for debug()', () => {
      logger.debug('debug message');
      expect(debugSpy).toHaveBeenCalledWith(expect.any(Object), 'debug message');
    });

    it('should call pino.trace for verbose()', () => {
      logger.verbose('verbose message');
      expect(traceSpy).toHaveBeenCalledWith(expect.any(Object), 'verbose message');
    });

    it('should include string params as context', () => {
      logger.log('test message', 'MyService');
      expect(infoSpy).toHaveBeenCalledWith(
        expect.objectContaining({ context: 'MyService' }),
        'test message',
      );
    });

    it('should include Error params as err object', () => {
      const error = new Error('test error');
      logger.error('failed', error);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          err: expect.objectContaining({
            message: 'test error',
            name: 'Error',
          }),
        }),
        'failed',
      );
    });

    it('should include object params as merged data', () => {
      logger.log('test', { tenantSlug: 'acme', count: 5 });
      expect(infoSpy).toHaveBeenCalledWith(
        expect.objectContaining({ tenantSlug: 'acme', count: 5 }),
        'test',
      );
    });

    it('should include traceId from RequestContext', () => {
      RequestContext.run(() => {
        RequestContext.set('traceId', 'ctx-trace-id');
        logger.log('with trace');
        expect(infoSpy).toHaveBeenCalledWith(
          expect.objectContaining({ traceId: 'ctx-trace-id' }),
          'with trace',
        );
      });
    });

    it('should include tenantId and userId from RequestContext', () => {
      RequestContext.run(() => {
        RequestContext.set('tenantId', 'tenant-1');
        RequestContext.set('userId', 'user-1');
        logger.log('with context');
        expect(infoSpy).toHaveBeenCalledWith(
          expect.objectContaining({ tenantId: 'tenant-1', userId: 'user-1' }),
          'with context',
        );
      });
    });
  });
});
