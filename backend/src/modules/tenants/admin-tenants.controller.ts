import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateTenantSchema,
  CreateTenantDto,
  UpdateTenantSchema,
  UpdateTenantDto,
} from './dto';
import { z } from 'zod';

const SuspendSchema = z.object({
  suspend: z.boolean(),
});

type SuspendDto = z.infer<typeof SuspendSchema>;

@ApiTags('Admin Tenants')
@Controller('admin/tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class AdminTenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const parsedPage = Math.max(1, parseInt(page || '1', 10) || 1);
    const parsedPageSize = Math.min(100, Math.max(1, parseInt(pageSize || '20', 10) || 20));

    const result = await this.tenantsService.listTenants(parsedPage, parsedPageSize, {
      status,
      search,
    });
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const result = await this.tenantsService.getTenantById(id);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ZodValidationPipe(CreateTenantSchema)) dto: CreateTenantDto,
  ) {
    const result = await this.tenantsService.createTenant(dto);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateTenantSchema)) dto: UpdateTenantDto,
  ) {
    const result = await this.tenantsService.updateTenant(id, dto);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Patch(':id/suspend')
  async suspend(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(SuspendSchema)) dto: SuspendDto,
  ) {
    const result = await this.tenantsService.suspendTenant(id, dto.suspend);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }
}
