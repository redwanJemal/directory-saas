import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { QueryParametersPipe } from '../../common/pipes/query-parameters.pipe';
import { QueryParameters, AllowedFilter } from '../../common/dto/query-parameters.dto';

const AUDIT_FILTERS: AllowedFilter[] = [
  { field: 'entity', operators: ['eq', 'in'], type: 'string' },
  { field: 'action', operators: ['eq', 'in'], type: 'string' },
  { field: 'userId', operators: ['eq'], type: 'string' },
  { field: 'entityId', operators: ['eq'], type: 'string' },
  { field: 'createdAt', operators: ['gte', 'lte', 'gt', 'lt'], type: 'date' },
];

const AUDIT_SORTS = ['createdAt', 'entity', 'action'];

@ApiTags('Audit Logs')
@Controller('api/v1/tenants/:tenantId/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'ADMIN')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async findAll(
    @Param('tenantId') tenantId: string,
    @Query(new QueryParametersPipe(AUDIT_FILTERS, AUDIT_SORTS)) query: QueryParameters,
  ) {
    const result = await this.auditService.findAll(tenantId, query);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }
}

@ApiTags('Admin Audit Logs')
@Controller('api/v1/admin/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class AdminAuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async findAll(
    @Query(new QueryParametersPipe(AUDIT_FILTERS, AUDIT_SORTS)) query: QueryParameters,
  ) {
    const result = await this.auditService.findAllAdmin(query);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }
}
