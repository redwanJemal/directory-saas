import { Global, Module } from '@nestjs/common';
import { AppConfigModule } from '../config/app-config.module';
import { AppConfigService } from '../config/app-config.service';
import { AppLoggerService } from './services/logger.service';
import { TenantCacheService } from './services/tenant-cache.service';

@Global()
@Module({
  imports: [AppConfigModule],
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
export class CommonModule {}
