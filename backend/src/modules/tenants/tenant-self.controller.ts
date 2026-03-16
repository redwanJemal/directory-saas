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
import { TenantSelfService } from './tenant-self.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { InviteUserSchema, InviteUserDto, ChangeRoleSchema, ChangeRoleDto } from './dto';

@Controller('tenants/me')
@UseGuards(JwtAuthGuard)
export class TenantSelfController {
  constructor(private readonly tenantSelfService: TenantSelfService) {}

  @Get('users')
  async listUsers(
    @CurrentTenant() tenantId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
  ) {
    const parsedPage = Math.max(1, parseInt(page || '1', 10) || 1);
    const parsedPageSize = Math.min(100, Math.max(1, parseInt(pageSize || '20', 10) || 20));

    const result = await this.tenantSelfService.listUsers(
      tenantId,
      parsedPage,
      parsedPageSize,
      search,
    );
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Get('roles')
  async listRoles(@CurrentTenant() tenantId: string) {
    const result = await this.tenantSelfService.listRoles(tenantId);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Post('users/invite')
  @HttpCode(HttpStatus.CREATED)
  async inviteUser(
    @CurrentTenant() tenantId: string,
    @Body(new ZodValidationPipe(InviteUserSchema)) dto: InviteUserDto,
  ) {
    const result = await this.tenantSelfService.inviteUser(tenantId, dto);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Patch('users/:userId/role')
  async changeUserRole(
    @CurrentTenant() tenantId: string,
    @Param('userId') userId: string,
    @Body(new ZodValidationPipe(ChangeRoleSchema)) dto: ChangeRoleDto,
  ) {
    const result = await this.tenantSelfService.changeUserRole(tenantId, userId, dto);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Delete('users/:userId')
  async removeUser(
    @CurrentTenant() tenantId: string,
    @Param('userId') userId: string,
  ) {
    const result = await this.tenantSelfService.removeUser(tenantId, userId);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }
}
