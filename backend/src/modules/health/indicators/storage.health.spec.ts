import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckError } from '@nestjs/terminus';
import { StorageHealthIndicator } from './storage.health';
import { AppConfigService } from '../../../config/app-config.service';

describe('StorageHealthIndicator', () => {
  let indicator: StorageHealthIndicator;
  const originalFetch = global.fetch;

  beforeEach(async () => {
    const configMock = {
      s3: { endpoint: 'http://localhost:9000' },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageHealthIndicator,
        { provide: AppConfigService, useValue: configMock },
      ],
    }).compile();

    indicator = module.get<StorageHealthIndicator>(StorageHealthIndicator);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should return up when MinIO responds ok', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });

    const result = await indicator.pingCheck('storage');

    expect(result).toEqual({ storage: { status: 'up' } });
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:9000/minio/health/live',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('should throw HealthCheckError when MinIO is down', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(indicator.pingCheck('storage')).rejects.toThrow(
      HealthCheckError,
    );
  });

  it('should throw HealthCheckError on non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503 });

    await expect(indicator.pingCheck('storage')).rejects.toThrow(
      HealthCheckError,
    );
  });
});
