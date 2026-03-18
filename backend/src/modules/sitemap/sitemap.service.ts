import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AppConfigService } from '../../config/app-config.service';
import { SUPPORTED_COUNTRIES, CITIES } from '../../common/constants/locations';

@Injectable()
export class SitemapService {
  private readonly baseUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {
    this.baseUrl = process.env.PUBLIC_URL || 'https://enathager.com';
  }

  async generateSitemap(): Promise<string> {
    const urls: SitemapUrl[] = [];

    // Static pages
    urls.push({ loc: '/', changefreq: 'daily', priority: 1.0 });
    urls.push({ loc: '/search', changefreq: 'daily', priority: 0.9 });
    urls.push({ loc: '/categories', changefreq: 'weekly', priority: 0.8 });
    urls.push({ loc: '/deals', changefreq: 'daily', priority: 0.7 });
    urls.push({ loc: '/events', changefreq: 'daily', priority: 0.7 });
    urls.push({ loc: '/jobs', changefreq: 'daily', priority: 0.7 });
    urls.push({ loc: '/cities', changefreq: 'monthly', priority: 0.6 });
    urls.push({ loc: '/new', changefreq: 'daily', priority: 0.6 });

    // Category pages
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });
    for (const cat of categories) {
      urls.push({
        loc: `/categories/${cat.slug}`,
        lastmod: cat.updatedAt.toISOString(),
        changefreq: 'weekly',
        priority: 0.7,
      });
    }

    // City pages
    for (const country of SUPPORTED_COUNTRIES) {
      const cities = CITIES[country.code] || [];
      for (const city of cities) {
        urls.push({
          loc: `/city/${country.code}/${encodeURIComponent(city.name)}`,
          changefreq: 'weekly',
          priority: 0.6,
        });
      }
    }

    // Business profile pages
    const providers = await this.prisma.providerProfile.findMany({
      where: {
        tenant: { status: 'ACTIVE' },
      },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 50000, // sitemap limit
    });
    for (const provider of providers) {
      urls.push({
        loc: `/business/${provider.id}`,
        lastmod: provider.updatedAt.toISOString(),
        changefreq: 'weekly',
        priority: 0.8,
      });
    }

    return this.buildXml(urls);
  }

  generateRobotsTxt(): string {
    const sitemapUrl = `${this.baseUrl}/sitemap.xml`;
    return [
      'User-agent: *',
      'Allow: /',
      '',
      '# Disallow private/auth pages',
      'Disallow: /dashboard',
      'Disallow: /login',
      'Disallow: /register',
      '',
      '# Disallow API endpoints',
      'Disallow: /api/',
      '',
      `Sitemap: ${sitemapUrl}`,
      '',
    ].join('\n');
  }

  private buildXml(urls: SitemapUrl[]): string {
    const urlEntries = urls.map((url) => {
      const loc = `${this.baseUrl}${url.loc}`;
      let entry = `  <url>\n    <loc>${this.escapeXml(loc)}</loc>`;
      if (url.lastmod) {
        entry += `\n    <lastmod>${url.lastmod}</lastmod>`;
      }
      if (url.changefreq) {
        entry += `\n    <changefreq>${url.changefreq}</changefreq>`;
      }
      if (url.priority !== undefined) {
        entry += `\n    <priority>${url.priority}</priority>`;
      }
      entry += '\n  </url>';
      return entry;
    });

    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...urlEntries,
      '</urlset>',
    ].join('\n');
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}
