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
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CreateRoleSchema, CreateRoleDto, UpdateRoleSchema, UpdateRoleDto } from './dto';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate } from '../../common/dto/pagination.dto';

@Controller('roles')
@UseGuards(JwtAuthGuard)
export class AdminRolesController {
  constructor(
    private readonly rolesService: RolesService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async listAll(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
    @Query('filter[name][contains]') search?: string,
  ) {
    const p = Math.max(1, parseInt(page, 10) || 1);
    const ps = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20));

    const where: Record<string, unknown> = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      this.prisma.role.findMany({
        where,
        include: {
          tenant: { select: { name: true, slug: true } },
          permissions: { include: { permission: true } },
        },
        skip: (p - 1) * ps,
        take: ps,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.role.count({ where }),
    ]);

    const mapped = items.map((role: any) => ({
      id: role.id,
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      isSystem: role.isSystem,
      tenantId: role.tenantId,
      tenant: role.tenant,
      permissions: (role.permissions || []).map((rp: any) =>
        rp.permission ? `${rp.permission.resource}:${rp.permission.action}` : rp.permissionId,
      ),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    }));

    return paginate(mapped, total, { page: p, pageSize: ps });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body(new ZodValidationPipe(CreateRoleSchema)) dto: CreateRoleDto & { tenantId: string }) {
    const result = await this.rolesService.create(dto.tenantId, dto);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateRoleSchema)) dto: UpdateRoleDto,
  ) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      const { AppException } = await import('../../common/exceptions/app.exception');
      throw new AppException('NOT_FOUND', 'Role not found');
    }
    const result = await this.rolesService.update(role.tenantId, id, dto);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      const { AppException } = await import('../../common/exceptions/app.exception');
      throw new AppException('NOT_FOUND', 'Role not found');
    }
    const result = await this.rolesService.delete(role.tenantId, id);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }
}
