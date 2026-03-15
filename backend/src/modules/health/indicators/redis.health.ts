import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { RedisService } from '../../../common/services/redis.service';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly redisService: RedisService) {
    super();
  }

  async pingCheck(key: string): Promise<HealthIndicatorResult> {
    try {
      const result = await this.redisService.getClient().ping();
      const isHealthy = result === 'PONG';
      if (isHealthy) {
        return this.getStatus(key, true);
      }
      throw new Error(`Unexpected ping response: ${result}`);
    } catch (error) {
      throw new HealthCheckError(
        `${key} health check failed`,
        this.getStatus(key, false, { message: error.message }),
      );
    }
  }
}
