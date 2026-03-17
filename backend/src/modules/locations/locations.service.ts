import { Injectable } from '@nestjs/common';
import { ServiceResult } from '../../common/types';
import { ErrorCodes } from '../../common/constants/error-codes';
import {
  SUPPORTED_COUNTRIES,
  CITIES,
  getCountryByCode,
  getCitiesForCountry,
  isValidCity,
  Country,
  City,
} from '../../common/constants/locations';

@Injectable()
export class LocationsService {
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
