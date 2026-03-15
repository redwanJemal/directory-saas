import { AppConfigService } from '../../config/app-config.service';

const mockRedisInstance = {
  on: jest.fn().mockReturnThis(),
  quit: jest.fn().mockResolvedValue('OK'),
  status: 'ready',
};

jest.mock('ioredis', () => {
  const MockRedis = jest.fn(() => mockRedisInstance);
  return { __esModule: true, default: MockRedis };
});

import { RedisService } from './redis.service';

describe('RedisService', () => {
  let service: RedisService;
  let mockConfig: Partial<AppConfigService>;

  beforeEach(() => {
    mockConfig = {
      redis: { host: 'localhost', port: 6379, password: undefined },
    };

    service = new RedisService(mockConfig as AppConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return a Redis client', () => {
    const client = service.getClient();
    expect(client).toBeDefined();
  });

  it('should disconnect on module destroy', async () => {
    await service.onModuleDestroy();
    expect(mockRedisInstance.quit).toHaveBeenCalled();
  });

  it('should register error and connect event handlers', () => {
    expect(mockRedisInstance.on).toHaveBeenCalledWith(
      'error',
      expect.any(Function),
    );
    expect(mockRedisInstance.on).toHaveBeenCalledWith(
      'connect',
      expect.any(Function),
    );
  });
});
