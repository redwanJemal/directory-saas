import { Test, TestingModule } from '@nestjs/testing';
import {
  HealthCheckService,
  HealthCheckResult,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { DatabaseHealthIndicator } from './indicators/database.health';
import { RedisHealthIndicator } from './indicators/redis.health';
import { StorageHealthIndicator } from './indicators/storage.health';
import { SearchHealthIndicator } from './indicators/search.health';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: { check: jest.Mock };

  const mockIndicator = () => ({ pingCheck: jest.fn() });

  beforeEach(async () => {
    healthCheckService = {
      check: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: healthCheckService },
        { provide: DatabaseHealthIndicator, useValue: mockIndicator() },
        { provide: RedisHealthIndicator, useValue: mockIndicator() },
        { provide: StorageHealthIndicator, useValue: mockIndicator() },
        { provide: SearchHealthIndicator, useValue: mockIndicator() },
        { provide: MemoryHealthIndicator, useValue: { checkHeap: jest.fn() } },
        { provide: DiskHealthIndicator, useValue: { checkStorage: jest.fn() } },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  describe('liveness', () => {
    it('should return ok status', async () => {
      const result: HealthCheckResult = {
        status: 'ok',
        info: {},
        error: {},
        details: {},
      };
      healthCheckService.check.mockResolvedValue(result);

      const response = await controller.liveness();

      expect(response).toEqual(result);
      expect(response.status).toBe('ok');
      expect(healthCheckService.check).toHaveBeenCalledWith([]);
    });
  });

  describe('readiness', () => {
    it('should return ok when all dependencies are healthy', async () => {
      const result: HealthCheckResult = {
        status: 'ok',
        info: {
          database: { status: 'up' },
          redis: { status: 'up' },
          storage: { status: 'up' },
          search: { status: 'up' },
          disk: { status: 'up' },
          memory_heap: { status: 'up' },
        },
        error: {},
        details: {
          database: { status: 'up' },
          redis: { status: 'up' },
          storage: { status: 'up' },
          search: { status: 'up' },
          disk: { status: 'up' },
          memory_heap: { status: 'up' },
        },
      };
      healthCheckService.check.mockResolvedValue(result);

      const response = await controller.readiness();

      expect(response.status).toBe('ok');
      expect(healthCheckService.check).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.any(Function),
          expect.any(Function),
          expect.any(Function),
          expect.any(Function),
          expect.any(Function),
          expect.any(Function),
        ]),
      );
    });

    it('should return error when a dependency is unhealthy', async () => {
      const result: HealthCheckResult = {
        status: 'error',
        info: {
          redis: { status: 'up' },
        },
        error: {
          database: { status: 'down', message: 'Connection refused' },
        },
        details: {
          database: { status: 'down', message: 'Connection refused' },
          redis: { status: 'up' },
        },
      };
      healthCheckService.check.mockResolvedValue(result);

      const response = await controller.readiness();

      expect(response.status).toBe('error');
    });
  });

  describe('auth bypass', () => {
    it('should have @Public() decorator on the controller', () => {
      const metadata = Reflect.getMetadata('isPublic', HealthController);
      expect(metadata).toBe(true);
    });
  });
});
