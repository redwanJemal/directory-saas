import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { ServiceResult } from '../../common/types';
import { ErrorCodes } from '../../common/constants/error-codes';
import {
  SUPPORTED_COUNTRIES,
  SUPPORTED_COUNTRY_CODES,
  CITIES,
  getCountryByCode,
  getCitiesForCountry,
  isValidCity,
  Country,
  City,
} from '../../common/constants/locations';

export interface DetectedCountry {
  countryCode: string | null;
  country: Country | null;
  source: 'header' | 'subdomain' | 'default' | 'none';
}

export interface CountryStats {
  country: Country;
  cities: City[];
  providerCount: number;
  categoryCount: number;
  featuredProviders: unknown[];
}

/** Default country when detection fails */
const DEFAULT_COUNTRY_CODE = 'AE';

/** Map of country-code subdomains to country codes */
const COUNTRY_SUBDOMAINS = new Set(
  SUPPORTED_COUNTRY_CODES.map((c) => c.toLowerCase()),
);

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}
  getCountries(): ServiceResult<Country[]> {
    return ServiceResult.ok(SUPPORTED_COUNTRIES);
  }

  getCitiesByCountry(countryCode: string): ServiceResult<City[]> {
    const country = getCountryByCode(countryCode);
    if (!country) {
      return ServiceResult.fail(
        ErrorCodes.NOT_FOUND,
        `Country with code '${countryCode}' is not supported`,
      );
    }

    const cities = getCitiesForCountry(countryCode) ?? [];
    return ServiceResult.ok(cities);
  }

  /**
   * Detect user's country from:
   * 1. CF-IPCountry header (set by Cloudflare)
   * 2. X-Country header (explicit override)
   * 3. Subdomain (ae.domain.com → AE)
   * 4. Default (AE — UAE)
   */
  detectCountry(req: Request): ServiceResult<DetectedCountry> {
    // 1. Cloudflare CF-IPCountry header
    const cfCountry = (req.headers['cf-ipcountry'] as string)?.toUpperCase();
    if (cfCountry && SUPPORTED_COUNTRY_CODES.includes(cfCountry)) {
      return ServiceResult.ok({
        countryCode: cfCountry,
        country: getCountryByCode(cfCountry) ?? null,
        source: 'header',
      });
    }

    // 2. Explicit X-Country header
    const xCountry = (req.headers['x-country'] as string)?.toUpperCase();
    if (xCountry && SUPPORTED_COUNTRY_CODES.includes(xCountry)) {
      return ServiceResult.ok({
        countryCode: xCountry,
        country: getCountryByCode(xCountry) ?? null,
        source: 'header',
      });
    }

    // 3. Subdomain detection (ae.habeshahub.com → AE)
    const host = req.headers.host;
    if (host) {
      const hostname = host.split(':')[0];
      const parts = hostname.split('.');
      if (parts.length >= 3) {
        const sub = parts[0].toLowerCase();
        if (COUNTRY_SUBDOMAINS.has(sub)) {
          const code = sub.toUpperCase();
          return ServiceResult.ok({
            countryCode: code,
            country: getCountryByCode(code) ?? null,
            source: 'subdomain',
          });
        }
      }
    }

    // 4. Default to UAE
    return ServiceResult.ok({
      countryCode: DEFAULT_COUNTRY_CODE,
      country: getCountryByCode(DEFAULT_COUNTRY_CODE) ?? null,
      source: 'default',
    });
  }

  async getCountryStats(countryCode: string): Promise<ServiceResult<CountryStats>> {
    const country = getCountryByCode(countryCode);
    if (!country) {
      return ServiceResult.fail(
        ErrorCodes.NOT_FOUND,
        `Country with code '${countryCode}' is not supported`,
      );
    }

    const cities = getCitiesForCountry(countryCode) ?? [];

    const [providerCount, categoryCount, featuredProviders] = await Promise.all([
      this.prisma.providerProfile.count({
        where: { country: countryCode },
      }),
      this.prisma.providerCategory.findMany({
        where: { providerProfile: { country: countryCode } },
        select: { categoryId: true },
        distinct: ['categoryId'],
      }).then((rows: { categoryId: string }[]) => rows.length),
      this.prisma.providerProfile.findMany({
        where: {
          country: countryCode,
          tenant: { status: 'ACTIVE', deletedAt: null },
        },
        orderBy: { rating: 'desc' },
        take: 6,
        include: {
          tenant: { select: { id: true, name: true, slug: true } },
          categories: { include: { category: { select: { id: true, name: true, slug: true } } } },
          packages: {
            where: { isActive: true },
            orderBy: { price: 'asc' },
            take: 1,
          },
        },
      }),
    ]);

    const mapped = featuredProviders.map((p: any) => ({
      id: p.id,
      name: p.displayName || p.tenant?.name || 'Unnamed',
      slug: p.slug || p.tenant?.slug || p.id,
      description: p.description,
      city: p.city || '',
      country: p.country || '',
      coverPhoto: p.coverImageUrl,
      rating: Number(p.rating) || 0,
      reviewCount: p.reviewCount || 0,
      startingPrice: p.packages?.[0] ? Number(p.packages[0].price) : 0,
      verified: p.isVerified || false,
      whatsapp: p.whatsapp,
      categories: (p.categories || []).map((pc: any) => ({
        id: pc.category.id,
        name: pc.category.name,
        slug: pc.category.slug,
        isPrimary: pc.isPrimary,
      })),
    }));

    return ServiceResult.ok({
      country,
      cities,
      providerCount,
      categoryCount,
      featuredProviders: mapped,
    });
  }

  validateLocation(
    countryCode: string,
    cityName?: string,
  ): ServiceResult<{ country: Country; city?: City }> {
    const country = getCountryByCode(countryCode);
    if (!country) {
      return ServiceResult.fail(
        ErrorCodes.VALIDATION_ERROR,
        `Unsupported country code '${countryCode}'. Supported: ${SUPPORTED_COUNTRIES.map((c) => c.code).join(', ')}`,
      );
    }

    if (cityName) {
      if (!isValidCity(countryCode, cityName)) {
        const validCities = (CITIES[countryCode] ?? []).map((c) => c.name).join(', ');
        return ServiceResult.fail(
          ErrorCodes.VALIDATION_ERROR,
          `City '${cityName}' is not valid for country '${countryCode}'. Valid cities: ${validCities}`,
        );
      }

      const city = CITIES[countryCode]?.find(
        (c) => c.name.toLowerCase() === cityName.toLowerCase(),
      );
      return ServiceResult.ok({ country, city });
    }

    return ServiceResult.ok({ country });
  }
}
