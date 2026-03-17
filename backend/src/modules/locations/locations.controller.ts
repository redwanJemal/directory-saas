import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { LocationsService } from './locations.service';

@ApiTags('Locations')
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('countries')
  @Public()
  getCountries() {
    const result = this.locationsService.getCountries();
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Get('countries/:code/cities')
  @Public()
  getCities(@Param('code') code: string) {
    const result = this.locationsService.getCitiesByCountry(code.toUpperCase());
    if (!result.success) throw result.toHttpException();
    return result.data;
  }
}
