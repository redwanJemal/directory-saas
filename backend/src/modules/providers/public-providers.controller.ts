import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { Public } from '../../common/decorators/public.decorator';

// === Public Search ===

@Controller('search')
export class SearchProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Get('providers')
  @Public()
  async searchProviders(
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('city') city?: string,
    @Query('country') country?: string,
    @Query('minRating') minRating?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('sort') sort?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const result = await this.providersService.searchProviders({
      q,
      category,
      city,
      country,
      minRating: minRating ? parseFloat(minRating) : undefined,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      sort,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
    if (!result.success) throw result.toHttpException();
    return result.data;
  }
}

// === Public Provider Profile ===

@Controller('providers')
export class PublicProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Get(':vendorId')
  @Public()
  async getPublicProfile(@Param('vendorId') vendorId: string) {
    const result = await this.providersService.getPublicProfile(vendorId);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }
}

// === Public Categories ===

@Controller('categories')
export class CategoriesController {
  constructor(private readonly providersService: ProvidersService) {}

  @Get()
  @Public()
  async listCategories() {
    const result = await this.providersService.listCategories();
    if (!result.success) throw result.toHttpException();
    return result.data;
  }
}
