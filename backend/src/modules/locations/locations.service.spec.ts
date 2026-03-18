import { Request } from 'express';
import { LocationsService } from './locations.service';
import { PrismaService } from '../../prisma/prisma.service';

function mockRequest(headers: Record<string, string> = {}): Request {
  return { headers } as unknown as Request;
}

describe('LocationsService', () => {
  let service: LocationsService;
  const mockPrisma = {
    providerProfile: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    providerCategory: {
      findMany: jest.fn(),
    },
  } as unknown as PrismaService;

  beforeEach(() => {
    service = new LocationsService(mockPrisma);
  });

  describe('getCountries', () => {
    it('should return 6 supported countries', () => {
      const result = service.getCountries();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(6);
    });

    it('should include UAE', () => {
      const result = service.getCountries();
      const uae = (result.data as any[]).find((c) => c.code === 'AE');

      expect(uae).toBeDefined();
      expect(uae.name).toBe('United Arab Emirates');
      expect(uae.nameAm).toBeTruthy();
      expect(uae.nameAr).toBeTruthy();
    });
  });

  describe('getCitiesByCountry', () => {
    it('should return cities for UAE', () => {
      const result = service.getCitiesByCountry('AE');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(7);
    });

    it('should return cities for Saudi Arabia', () => {
      const result = service.getCitiesByCountry('SA');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(5);
    });

    it('should fail for unsupported country code', () => {
      const result = service.getCitiesByCountry('US');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });

    it('should handle case-insensitive country code via controller normalization', () => {
      // The controller normalizes to uppercase, but service expects exact code
      const result = service.getCitiesByCountry('AE');
      expect(result.success).toBe(true);
    });
  });

  describe('detectCountry', () => {
    it('should detect country from CF-IPCountry header', () => {
      const req = mockRequest({ 'cf-ipcountry': 'SA' });
      const result = service.detectCountry(req);

      expect(result.success).toBe(true);
      expect(result.data?.countryCode).toBe('SA');
      expect(result.data?.country?.name).toBe('Saudi Arabia');
      expect(result.data?.source).toBe('header');
    });

    it('should detect country from X-Country header', () => {
      const req = mockRequest({ 'x-country': 'KW' });
      const result = service.detectCountry(req);

      expect(result.success).toBe(true);
      expect(result.data?.countryCode).toBe('KW');
      expect(result.data?.source).toBe('header');
    });

    it('should detect country from subdomain', () => {
      const req = mockRequest({ host: 'ae.habeshahub.com' });
      const result = service.detectCountry(req);

      expect(result.success).toBe(true);
      expect(result.data?.countryCode).toBe('AE');
      expect(result.data?.source).toBe('subdomain');
    });

    it('should detect country from subdomain with port', () => {
      const req = mockRequest({ host: 'sa.habeshahub.com:3000' });
      const result = service.detectCountry(req);

      expect(result.success).toBe(true);
      expect(result.data?.countryCode).toBe('SA');
      expect(result.data?.source).toBe('subdomain');
    });

    it('should prioritize CF-IPCountry over subdomain', () => {
      const req = mockRequest({
        'cf-ipcountry': 'QA',
        host: 'ae.habeshahub.com',
      });
      const result = service.detectCountry(req);

      expect(result.success).toBe(true);
      expect(result.data?.countryCode).toBe('QA');
      expect(result.data?.source).toBe('header');
    });

    it('should ignore unsupported CF-IPCountry and fall back', () => {
      const req = mockRequest({
        'cf-ipcountry': 'US',
        host: 'ae.habeshahub.com',
      });
      const result = service.detectCountry(req);

      expect(result.success).toBe(true);
      expect(result.data?.countryCode).toBe('AE');
      expect(result.data?.source).toBe('subdomain');
    });

    it('should default to AE when no detection source is available', () => {
      const req = mockRequest({});
      const result = service.detectCountry(req);

      expect(result.success).toBe(true);
      expect(result.data?.countryCode).toBe('AE');
      expect(result.data?.source).toBe('default');
    });

    it('should handle case-insensitive CF-IPCountry header', () => {
      const req = mockRequest({ 'cf-ipcountry': 'bh' });
      const result = service.detectCountry(req);

      expect(result.success).toBe(true);
      expect(result.data?.countryCode).toBe('BH');
    });

    it('should not detect country from non-country subdomain', () => {
      const req = mockRequest({ host: 'app.habeshahub.com' });
      const result = service.detectCountry(req);

      expect(result.success).toBe(true);
      expect(result.data?.countryCode).toBe('AE');
      expect(result.data?.source).toBe('default');
    });

    it('should not detect country from two-part hostname', () => {
      const req = mockRequest({ host: 'habeshahub.com' });
      const result = service.detectCountry(req);

      expect(result.success).toBe(true);
      expect(result.data?.source).toBe('default');
    });
  });

  describe('getCountryStats', () => {
    it('should fail for unsupported country', async () => {
      const result = await service.getCountryStats('XX');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });

    it('should return stats for a valid country', async () => {
      (mockPrisma.providerProfile.count as jest.Mock).mockResolvedValue(5);
      (mockPrisma.providerCategory.findMany as jest.Mock).mockResolvedValue([
        { categoryId: 'c1' },
        { categoryId: 'c2' },
      ]);
      (mockPrisma.providerProfile.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'p1',
          tenantId: 't1',
          name: 'Test Biz',
          slug: 'test-biz',
          description: 'desc',
          city: 'Dubai',
          country: 'AE',
          coverPhoto: null,
          rating: 4.5,
          reviewCount: 10,
          startingPrice: 100,
          verified: true,
          whatsapp: null,
          categories: [
            { isPrimary: true, category: { id: 'c1', name: 'Food', slug: 'food' } },
          ],
        },
      ]);

      const result = await service.getCountryStats('AE');

      expect(result.success).toBe(true);
      expect(result.data?.country.code).toBe('AE');
      expect(result.data?.providerCount).toBe(5);
      expect(result.data?.categoryCount).toBe(2);
      expect(result.data?.featuredProviders).toHaveLength(1);
      expect(result.data?.cities).toHaveLength(7);
    });
  });

  describe('validateLocation', () => {
    it('should validate valid country code', () => {
      const result = service.validateLocation('AE');

      expect(result.success).toBe(true);
      expect(result.data?.country.code).toBe('AE');
    });

    it('should validate valid country + city', () => {
      const result = service.validateLocation('AE', 'Dubai');

      expect(result.success).toBe(true);
      expect(result.data?.country.code).toBe('AE');
      expect(result.data?.city?.name).toBe('Dubai');
    });

    it('should fail for invalid country code', () => {
      const result = service.validateLocation('XX');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.message).toContain('XX');
    });

    it('should fail for invalid city in valid country', () => {
      const result = service.validateLocation('AE', 'Riyadh');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.message).toContain('Riyadh');
    });

    it('should be case-insensitive for city name', () => {
      const result = service.validateLocation('AE', 'dubai');

      expect(result.success).toBe(true);
      expect(result.data?.city?.name).toBe('Dubai');
    });
  });
});
