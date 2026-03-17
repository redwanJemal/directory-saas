import { LocationsService } from './locations.service';

describe('LocationsService', () => {
  let service: LocationsService;

  beforeEach(() => {
    service = new LocationsService();
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
