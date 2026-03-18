import { Controller, Get, Header, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { SitemapService } from './sitemap.service';

@ApiTags('SEO')
@Controller()
export class SitemapController {
  constructor(private readonly sitemapService: SitemapService) {}

  @Get('sitemap.xml')
  @Public()
  @Header('Content-Type', 'application/xml')
  async sitemap(@Res() res: Response) {
    const xml = await this.sitemapService.generateSitemap();
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  }

  @Get('robots.txt')
  @Public()
  @Header('Content-Type', 'text/plain')
  robotsTxt(@Res() res: Response) {
    const txt = this.sitemapService.generateRobotsTxt();
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(txt);
  }
}
