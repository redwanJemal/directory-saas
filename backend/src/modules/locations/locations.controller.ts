import { Controller, Get, Param, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
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

  @Get('detect')
  @Public()
  detectCountry(@Req() req: Request) {
    const result = this.locationsService.detectCountry(req);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Get('countries/:code/stats')
  @Public()
  async getCountryStats(@Param('code') code: string) {
    const result = await this.locationsService.getCountryStats(code.toUpperCase());
    if (!result.success) throw result.toHttpException();
    return result.data;
  }
}
