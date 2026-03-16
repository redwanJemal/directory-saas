import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UsersService } from './users.service';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('type') type?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize || '20', 10) || 20));
    const validTypes = ['admin', 'tenant', 'client'] as const;
    const userType = validTypes.includes(type as (typeof validTypes)[number])
      ? (type as 'admin' | 'tenant' | 'client')
      : undefined;

    const result = await this.usersService.listUsers(pageNum, pageSizeNum, userType);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const result = await this.usersService.getUserById(id);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }
}
