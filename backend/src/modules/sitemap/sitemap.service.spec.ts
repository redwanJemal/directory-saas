import { Test, TestingModule } from '@nestjs/testing';
import { SitemapService } from './sitemap.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AppConfigService } from '../../config/app-config.service';

describe('SitemapService', () => {
  let service: SitemapService;
  let prisma: { category: { findMany: jest.Mock }; providerProfile: { findMany: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      category: {
        findMany: jest.fn().mockResolvedValue([
          { slug: 'food-drink', updatedAt: new Date('2026-01-01T00:00:00Z') },
          { slug: 'beauty-grooming', updatedAt: new Date('2026-01-15T00:00:00Z') },
        ]),
      },
      providerProfile: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'provider-1', updatedAt: new Date('2026-02-01T00:00:00Z') },
          { id: 'provider-2', updatedAt: new Date('2026-02-15T00:00:00Z') },
        ]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SitemapService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: AppConfigService,
          useValue: { appName: 'Habesha Hub' },
        },
      ],
    }).compile();

    service = module.get<SitemapService>(SitemapService);
  });

  describe('generateSitemap', () => {
    it('should generate valid XML sitemap', async () => {
      const xml = await service.generateSitemap();

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
      expect(xml).toContain('</urlset>');
    });

    it('should include static pages', async () => {
      const xml = await service.generateSitemap();

      expect(xml).toContain('/search');
      expect(xml).toContain('/categories');
      expect(xml).toContain('/deals');
      expect(xml).toContain('/events');
      expect(xml).toContain('/jobs');
      expect(xml).toContain('/cities');
    });

    it('should include category pages', async () => {
      const xml = await service.generateSitemap();

      expect(xml).toContain('/categories/food-drink');
      expect(xml).toContain('/categories/beauty-grooming');
    });

    it('should include city pages', async () => {
      const xml = await service.generateSitemap();

      expect(xml).toContain('/city/AE/Dubai');
      expect(xml).toContain('/city/SA/Riyadh');
    });

    it('should include provider profile pages', async () => {
      const xml = await service.generateSitemap();

      expect(xml).toContain('/business/provider-1');
      expect(xml).toContain('/business/provider-2');
    });

    it('should include lastmod for providers', async () => {
      const xml = await service.generateSitemap();

      expect(xml).toContain('<lastmod>2026-02-01T00:00:00.000Z</lastmod>');
    });

    it('should include changefreq and priority', async () => {
      const xml = await service.generateSitemap();

      expect(xml).toContain('<changefreq>daily</changefreq>');
      expect(xml).toContain('<priority>1</priority>');
    });

    it('should query categories with isActive filter', async () => {
      await service.generateSitemap();

      expect(prisma.category.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      });
    });

    it('should query providers with active tenant filter', async () => {
      await service.generateSitemap();

      expect(prisma.providerProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenant: { status: 'ACTIVE' } },
          take: 50000,
        }),
      );
    });
  });

  describe('generateRobotsTxt', () => {
    it('should generate valid robots.txt', () => {
      const txt = service.generateRobotsTxt();

      expect(txt).toContain('User-agent: *');
      expect(txt).toContain('Allow: /');
    });

    it('should disallow dashboard and auth routes', () => {
      const txt = service.generateRobotsTxt();

      expect(txt).toContain('Disallow: /dashboard');
      expect(txt).toContain('Disallow: /login');
      expect(txt).toContain('Disallow: /register');
    });

    it('should disallow API endpoints', () => {
      const txt = service.generateRobotsTxt();

      expect(txt).toContain('Disallow: /api/');
    });

    it('should include sitemap URL', () => {
      const txt = service.generateRobotsTxt();

      expect(txt).toContain('Sitemap:');
      expect(txt).toContain('sitemap.xml');
    });
  });
});
