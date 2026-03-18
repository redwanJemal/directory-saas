import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AppConfigModule } from '../../config/app-config.module';
import { SitemapController } from './sitemap.controller';
import { SitemapService } from './sitemap.service';

@Module({
  imports: [PrismaModule, AppConfigModule],
  controllers: [SitemapController],
  providers: [SitemapService],
})
export class SitemapModule {}
