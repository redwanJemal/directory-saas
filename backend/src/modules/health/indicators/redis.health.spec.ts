import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckError } from '@nestjs/terminus';
import { RedisHealthIndicator } from './redis.health';
import { RedisService } from '../../../common/services/redis.service';

describe('RedisHealthIndicator', () => {
  let indicator: RedisHealthIndicator;
  let redisMock: { getClient: jest.Mock };

  beforeEach(async () => {
    redisMock = {
      getClient: jest.fn().mockReturnValue({
        ping: jest.fn(),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisHealthIndicator,
        { provide: RedisService, useValue: redisMock },
      ],
    }).compile();

    indicator = module.get<RedisHealthIndicator>(RedisHealthIndicator);
  });

  it('should return up when Redis responds with PONG', async () => {
    redisMock.getClient().ping.mockResolvedValue('PONG');

    const result = await indicator.pingCheck('redis');

    expect(result).toEqual({ redis: { status: 'up' } });
  });

  it('should throw HealthCheckError when Redis is down', async () => {
    redisMock.getClient().ping.mockRejectedValue(new Error('Connection refused'));

    await expect(indicator.pingCheck('redis')).rejects.toThrow(
      HealthCheckError,
    );
  });

  it('should throw HealthCheckError on unexpected ping response', async () => {
    redisMock.getClient().ping.mockResolvedValue('UNEXPECTED');

    await expect(indicator.pingCheck('redis')).rejects.toThrow(
      HealthCheckError,
    );
  });
});
