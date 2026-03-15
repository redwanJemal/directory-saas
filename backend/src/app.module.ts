import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AppConfigModule } from './config/app-config.module';
import { AppConfigService } from './config/app-config.service';
import { PrismaModule } from './prisma/prisma.module';
import { AppLoggerService } from './common/services/logger.service';
import { TenantCacheService } from './common/services/tenant-cache.service';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { RequestLoggingMiddleware } from './common/middleware/request-logging.middleware';
import { TenantResolutionMiddleware } from './common/middleware/tenant-resolution.middleware';
import { AuthModule } from './modules/auth/auth.module';
import { RolesModule } from './modules/roles/roles.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { ThrottlerModule } from './common/modules/throttler.module';

@Module({
  imports: [AppConfigModule, PrismaModule, ThrottlerModule, AuthModule, RolesModule, SubscriptionsModule, UploadsModule],
  providers: [
    {
      provide: AppLoggerService,
      useFactory: (configService: AppConfigService) => {
        return new AppLoggerService({
          level: configService.logLevel,
          isProduction: configService.isProduction,
        });
      },
      inject: [AppConfigService],
    },
    TenantCacheService,
  ],
  exports: [AppLoggerService, TenantCacheService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(CorrelationIdMiddleware, RequestLoggingMiddleware)
      .forRoutes('*');

    consumer
      .apply(TenantResolutionMiddleware)
      .forRoutes('*');
  }
}
