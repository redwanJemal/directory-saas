import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ProvidersService } from './providers.service';
import { VerificationService } from './verification.service';
import { ContactClickService } from './contact-click.service';
import { ProvidersController } from './providers.controller';
import { AvailabilityController } from './availability.controller';
import { AdminVerificationController } from './admin-verification.controller';
import {
  ContactClickController,
  ProviderContactStatsController,
  AdminContactAnalyticsController,
} from './contact-click.controller';
import {
  SearchProvidersController,
  PublicProvidersController,
  CategoriesController,
} from './public-providers.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    ProvidersController,
    AvailabilityController,
    AdminVerificationController,
    ContactClickController,
    ProviderContactStatsController,
    AdminContactAnalyticsController,
    SearchProvidersController,
    PublicProvidersController,
    CategoriesController,
  ],
  providers: [ProvidersService, VerificationService, ContactClickService],
  exports: [ProvidersService, VerificationService, ContactClickService],
})
export class ProvidersModule {}
