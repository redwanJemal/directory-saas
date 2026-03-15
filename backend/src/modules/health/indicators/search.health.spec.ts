import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckError } from '@nestjs/terminus';
import { SearchHealthIndicator } from './search.health';
import { AppConfigService } from '../../../config/app-config.service';

describe('SearchHealthIndicator', () => {
  let indicator: SearchHealthIndicator;
  const originalFetch = global.fetch;

  beforeEach(async () => {
    const configMock = {
      meilisearch: { url: 'http://localhost:7700', apiKey: '' },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchHealthIndicator,
        { provide: AppConfigService, useValue: configMock },
      ],
    }).compile();

    indicator = module.get<SearchHealthIndicator>(SearchHealthIndicator);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should return up when Meilisearch responds ok', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });

    const result = await indicator.pingCheck('search');

    expect(result).toEqual({ search: { status: 'up' } });
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:7700/health',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('should throw HealthCheckError when Meilisearch is down', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(indicator.pingCheck('search')).rejects.toThrow(
      HealthCheckError,
    );
  });

  it('should throw HealthCheckError on non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 502 });

    await expect(indicator.pingCheck('search')).rejects.toThrow(
      HealthCheckError,
    );
  });
});
