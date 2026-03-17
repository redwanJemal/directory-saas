import {
  SUPPORTED_COUNTRIES,
  CITIES,
  SUPPORTED_COUNTRY_CODES,
  getCountryByCode,
  getCitiesForCountry,
  isValidCity,
} from './locations';

describe('Location Constants', () => {
  describe('SUPPORTED_COUNTRIES', () => {
    it('should have 6 supported countries', () => {
      expect(SUPPORTED_COUNTRIES).toHaveLength(6);
    });

    it('should have unique country codes', () => {
      const codes = SUPPORTED_COUNTRIES.map((c) => c.code);
      expect(new Set(codes).size).toBe(codes.length);
    });

    it('should include all Gulf states', () => {
      const codes = SUPPORTED_COUNTRY_CODES;
      expect(codes).toContain('AE');
      expect(codes).toContain('SA');
      expect(codes).toContain('KW');
      expect(codes).toContain('QA');
      expect(codes).toContain('BH');
      expect(codes).toContain('OM');
    });

    it('should have name, nameAm, and nameAr for every country', () => {
      for (const country of SUPPORTED_COUNTRIES) {
        expect(country.code).toBeTruthy();
        expect(country.name).toBeTruthy();
        expect(country.nameAm).toBeTruthy();
        expect(country.nameAr).toBeTruthy();
      }
    });
  });

  describe('CITIES', () => {
    it('should have cities for every supported country', () => {
      for (const code of SUPPORTED_COUNTRY_CODES) {
        expect(CITIES[code]).toBeDefined();
        expect(CITIES[code].length).toBeGreaterThan(0);
      }
    });

    it('should have 7 UAE cities', () => {
      expect(CITIES['AE']).toHaveLength(7);
    });

    it('should have name, nameAm, and nameAr for every city', () => {
      for (const code of SUPPORTED_COUNTRY_CODES) {
        for (const city of CITIES[code]) {
          expect(city.name).toBeTruthy();
          expect(city.nameAm).toBeTruthy();
          expect(city.nameAr).toBeTruthy();
        }
      }
    });

    it('should not have cities for unsupported country codes', () => {
      expect(CITIES['US']).toBeUndefined();
      expect(CITIES['ET']).toBeUndefined();
    });
  });

  describe('getCountryByCode', () => {
    it('should return country for valid code', () => {
      const country = getCountryByCode('AE');
      expect(country).toBeDefined();
      expect(country?.name).toBe('United Arab Emirates');
    });

    it('should return undefined for invalid code', () => {
      expect(getCountryByCode('XX')).toBeUndefined();
    });
  });

  describe('getCitiesForCountry', () => {
    it('should return cities for valid country', () => {
      const cities = getCitiesForCountry('AE');
      expect(cities).toBeDefined();
      expect(cities?.length).toBe(7);
    });

    it('should return undefined for invalid country', () => {
      expect(getCitiesForCountry('XX')).toBeUndefined();
    });
  });

  describe('isValidCity', () => {
    it('should return true for valid city in country', () => {
      expect(isValidCity('AE', 'Dubai')).toBe(true);
    });

    it('should be case-insensitive', () => {
      expect(isValidCity('AE', 'dubai')).toBe(true);
      expect(isValidCity('AE', 'DUBAI')).toBe(true);
    });

    it('should return false for city not in country', () => {
      expect(isValidCity('AE', 'Riyadh')).toBe(false);
    });

    it('should return false for invalid country code', () => {
      expect(isValidCity('XX', 'Dubai')).toBe(false);
    });
  });
});
