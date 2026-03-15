import { Module, Global } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppConfigService } from '../../config/app-config.service';
import { AppConfigModule } from '../../config/app-config.module';
import { RedisService } from '../services/redis.service';
import { RateLimitService } from '../services/rate-limit.service';
import { CacheService } from '../services/cache.service';
import {
  ThrottlerGuard,
  ThrottlerConfig,
  THROTTLER_CONFIG,
} from '../guards/throttler.guard';

@Global()
@Module({
  imports: [AppConfigModule],
  providers: [
    RedisService,
    RateLimitService,
    CacheService,
    {
      provide: THROTTLER_CONFIG,
      useFactory: (config: AppConfigService): ThrottlerConfig => ({
        limit: config.throttle.limit,
        ttl: config.throttle.ttl,
      }),
      inject: [AppConfigService],
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [RedisService, RateLimitService, CacheService],
})
export class ThrottlerModule {}
