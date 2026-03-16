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
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateRoleSchema,
  CreateRoleDto,
  UpdateRoleSchema,
  UpdateRoleDto,
  SetPermissionsSchema,
  SetPermissionsDto,
  AssignRolesSchema,
  AssignRolesDto,
} from './dto';

@Controller('tenants/:tenantId/roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('roles:create')
  async create(
    @Param('tenantId') tenantId: string,
    @Body(new ZodValidationPipe(CreateRoleSchema)) dto: CreateRoleDto,
  ) {
    const result = await this.rolesService.create(tenantId, dto);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Get()
  @RequirePermission('roles:read')
  async findAll(@Param('tenantId') tenantId: string) {
    const result = await this.rolesService.findAll(tenantId);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Get('permissions')
  @RequirePermission('roles:read')
  async listPermissions() {
    const result = await this.rolesService.listPermissions();
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Get(':id')
  @RequirePermission('roles:read')
  async findOne(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    const result = await this.rolesService.findOne(tenantId, id);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Patch(':id')
  @RequirePermission('roles:update')
  async update(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateRoleSchema)) dto: UpdateRoleDto,
  ) {
    const result = await this.rolesService.update(tenantId, id, dto);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Delete(':id')
  @RequirePermission('roles:delete')
  async remove(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    const result = await this.rolesService.delete(tenantId, id);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Put(':id/permissions')
  @RequirePermission('roles:update')
  async setPermissions(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(SetPermissionsSchema)) dto: SetPermissionsDto,
  ) {
    const result = await this.rolesService.setPermissions(tenantId, id, dto);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }
}

@Controller('tenants/:tenantId/users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserRolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Put(':userId/roles')
  @RequirePermission('users:manage')
  async assignRoles(
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
    @Body(new ZodValidationPipe(AssignRolesSchema)) dto: AssignRolesDto,
  ) {
    const result = await this.rolesService.assignRolesToUser(tenantId, userId, dto);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }
}
