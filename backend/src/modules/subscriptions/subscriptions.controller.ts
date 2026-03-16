import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Put,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreatePlanSchema,
  CreatePlanDto,
  UpdatePlanSchema,
  UpdatePlanDto,
  AssignSubscriptionSchema,
  AssignSubscriptionDto,
  SetOverridesSchema,
  SetOverridesDto,
} from './dto';

// === Admin Plan Management ===

@Controller('admin/plans')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class AdminPlansController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ZodValidationPipe(CreatePlanSchema)) dto: CreatePlanDto,
  ) {
    const result = await this.subscriptionsService.createPlan(dto);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Get()
  async listAll() {
    const result = await this.subscriptionsService.listPlans(false);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdatePlanSchema)) dto: UpdatePlanDto,
  ) {
    const result = await this.subscriptionsService.updatePlan(id, dto);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Delete(':id')
  async deactivate(@Param('id') id: string) {
    const result = await this.subscriptionsService.deactivatePlan(id);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }
}

// === Admin Tenant Subscription Management ===

@Controller('admin/tenants/:tenantId/subscription')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class AdminTenantSubscriptionController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  async get(@Param('tenantId') tenantId: string) {
    const result = await this.subscriptionsService.getTenantSubscription(tenantId);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Put()
  async assign(
    @Param('tenantId') tenantId: string,
    @Body(new ZodValidationPipe(AssignSubscriptionSchema)) dto: AssignSubscriptionDto,
  ) {
    const result = await this.subscriptionsService.assignSubscription(tenantId, dto);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Patch('overrides')
  async setOverrides(
    @Param('tenantId') tenantId: string,
    @Body(new ZodValidationPipe(SetOverridesSchema)) dto: SetOverridesDto,
  ) {
    const result = await this.subscriptionsService.setOverrides(tenantId, dto);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }
}

// === Public Plans ===

@Controller('plans')
export class PublicPlansController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  @Public()
  async listAvailable() {
    const result = await this.subscriptionsService.listPlans(true);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }
}

// === Tenant Subscription View ===

@Controller('tenants/:tenantId/subscription')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantSubscriptionController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  @RequirePermission('subscriptions:read')
  async get(@Param('tenantId') tenantId: string) {
    const result = await this.subscriptionsService.getTenantSubscription(tenantId);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Get('usage')
  @RequirePermission('subscriptions:read')
  async getUsage(@Param('tenantId') tenantId: string) {
    const result = await this.subscriptionsService.getUsageSummary(tenantId);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }
}
