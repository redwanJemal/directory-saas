import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ProvidersService } from './providers.service';
import { ProvidersController } from './providers.controller';
import { AvailabilityController } from './availability.controller';
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
    SearchProvidersController,
    PublicProvidersController,
    CategoriesController,
  ],
  providers: [ProvidersService],
  exports: [ProvidersService],
})
export class ProvidersModule {}
