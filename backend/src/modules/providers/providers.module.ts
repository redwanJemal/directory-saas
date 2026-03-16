import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ProvidersService } from './providers.service';
import { ProvidersController } from './providers.controller';
import {
  SearchProvidersController,
  PublicProvidersController,
  CategoriesController,
} from './public-providers.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    ProvidersController,
    SearchProvidersController,
    PublicProvidersController,
    CategoriesController,
  ],
  providers: [ProvidersService],
  exports: [ProvidersService],
})
export class ProvidersModule {}
