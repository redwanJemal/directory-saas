import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppConfigModule } from './config/app-config.module';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { RequestLoggingMiddleware } from './common/middleware/request-logging.middleware';
import { TenantResolutionMiddleware } from './common/middleware/tenant-resolution.middleware';
import { SecurityHeadersMiddleware } from './common/middleware/security-headers.middleware';
import { AuthModule } from './modules/auth/auth.module';
import { RolesModule } from './modules/roles/roles.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { EventsModule } from './modules/events/events.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { HealthModule } from './modules/health/health.module';
import { AuditModule } from './modules/audit/audit.module';
import { SearchModule } from './modules/search/search.module';
import { AiModule } from './modules/ai/ai.module';
import { UsersModule } from './modules/users/users.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { ProvidersModule } from './modules/providers/providers.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { SettingsModule } from './modules/settings/settings.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { LocationsModule } from './modules/locations/locations.module';
import { DealsModule } from './modules/deals/deals.module';
import { CommunityEventsModule } from './modules/community-events/community-events.module';
import { ThrottlerModule } from './common/modules/throttler.module';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    CommonModule,
    EventEmitterModule.forRoot({ wildcard: true, delimiter: '.' }),
    ThrottlerModule,
    AuthModule,
    TenantsModule,
    RolesModule,
    SubscriptionsModule,
    UploadsModule,
    JobsModule,
    EventsModule,
    NotificationsModule,
    HealthModule,
    AuditModule,
    SearchModule,
    AiModule,
    UsersModule,
    ProvidersModule,
    BookingsModule,
    ReviewsModule,
    ConversationsModule,
    SettingsModule,
    AnalyticsModule,
    LocationsModule,
    DealsModule,
    CommunityEventsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(
        SecurityHeadersMiddleware,
        CorrelationIdMiddleware,
        RequestLoggingMiddleware,
      )
      .forRoutes('*');

    consumer
      .apply(TenantResolutionMiddleware)
      .forRoutes('*');
  }
}
