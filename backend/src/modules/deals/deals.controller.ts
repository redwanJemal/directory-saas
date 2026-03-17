import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { DealsService } from './deals.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CreateDealSchema, CreateDealDto, UpdateDealSchema, UpdateDealDto } from './dto';

// === Provider Deals CRUD ===

@Controller('providers/me/deals')
@UseGuards(JwtAuthGuard)
export class ProviderDealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Get()
  async list(
    @CurrentTenant() tenantId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize || '20', 10) || 20));

    const result = await this.dealsService.listProviderDeals(tenantId, pageNum, pageSizeNum);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentTenant() tenantId: string,
    @Body(new ZodValidationPipe(CreateDealSchema)) dto: CreateDealDto,
  ) {
    const result = await this.dealsService.createDeal(tenantId, dto);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Patch(':id')
  async update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateDealSchema)) dto: UpdateDealDto,
  ) {
    const result = await this.dealsService.updateDeal(tenantId, id, dto);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Delete(':id')
  async delete(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    const result = await this.dealsService.deleteDeal(tenantId, id);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }
}

// === Public Deals ===

@Controller('deals')
export class PublicDealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Get()
  @Public()
  async listActiveDeals(
    @Query('country') country?: string,
    @Query('city') city?: string,
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const result = await this.dealsService.listActiveDeals({
      country,
      city,
      category,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Get('featured')
  @Public()
  async getFeaturedDeals() {
    const result = await this.dealsService.getFeaturedDeals();
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Get(':id')
  @Public()
  async getDealById(@Param('id') id: string) {
    const result = await this.dealsService.getDealById(id);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }
}
