import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ProvidersService } from './providers.service';
import { VerificationService } from './verification.service';
import { ProvidersController } from './providers.controller';
import { AvailabilityController } from './availability.controller';
import { AdminVerificationController } from './admin-verification.controller';
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
    SearchProvidersController,
    PublicProvidersController,
    CategoriesController,
  ],
  providers: [ProvidersService, VerificationService],
  exports: [ProvidersService, VerificationService],
})
export class ProvidersModule {}
