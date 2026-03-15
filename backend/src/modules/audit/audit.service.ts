import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ServiceResult } from '../../common/types';
import { QueryParameters, AllowedFilter } from '../../common/dto/query-parameters.dto';
import { PaginatedResult, paginate } from '../../common/dto/pagination.dto';
import { buildPrismaQuery } from '../../common/services/prisma-query-builder';
import { AuditLogEntry } from './dto/audit-log-entry.dto';

const SENSITIVE_FIELDS = [
  'passwordHash',
  'password_hash',
  'twoFactorSecret',
  'two_factor_secret',
  'tokenHash',
  'token_hash',
  'refreshToken',
  'refresh_token',
  'secret',
  'apiKey',
  'api_key',
];

const REDACTED = '[REDACTED]';

const ALLOWED_FILTERS: AllowedFilter[] = [
  { field: 'entity', operators: ['eq', 'in'], type: 'string' },
  { field: 'action', operators: ['eq', 'in'], type: 'string' },
  { field: 'userId', operators: ['eq'], type: 'string' },
  { field: 'entityId', operators: ['eq'], type: 'string' },
  { field: 'createdAt', operators: ['gte', 'lte', 'gt', 'lt'], type: 'date' },
];

const ALLOWED_SORTS = ['createdAt', 'entity', 'action'];

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditLogEntry): Promise<ServiceResult<unknown>> {
    const data = {
      tenantId: entry.tenantId || null,
      userId: entry.userId || null,
      userType: entry.userType || null,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId || null,
      oldData: (entry.oldData
        ? maskSensitiveData(entry.oldData)
        : Prisma.JsonNull) as Prisma.InputJsonValue,
      newData: (entry.newData
        ? maskSensitiveData(entry.newData)
        : Prisma.JsonNull) as Prisma.InputJsonValue,
      metadata: (entry.metadata || Prisma.JsonNull) as Prisma.InputJsonValue,
      ipAddress: entry.ipAddress || null,
      userAgent: entry.userAgent || null,
    };

    const auditLog = await this.prisma.auditLog.create({ data });
    return ServiceResult.ok(auditLog);
  }

  async findAll(
    tenantId: string,
    query: QueryParameters,
  ): Promise<ServiceResult<PaginatedResult<unknown>>> {
    const { where, orderBy, skip, take } = buildPrismaQuery(
      query,
      ALLOWED_FILTERS,
      ALLOWED_SORTS,
    );

    // Scope to tenant
    where.tenantId = tenantId;

    // Remove auto-added deletedAt filter (AuditLog has no deletedAt)
    delete where.deletedAt;

    // Default sort by createdAt desc
    const finalOrderBy = orderBy.length > 0 ? orderBy : [{ createdAt: 'desc' }];

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: finalOrderBy,
        skip,
        take,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return ServiceResult.ok(paginate(items, total, query));
  }

  async findAllAdmin(
    query: QueryParameters,
  ): Promise<ServiceResult<PaginatedResult<unknown>>> {
    const { where, orderBy, skip, take } = buildPrismaQuery(
      query,
      ALLOWED_FILTERS,
      ALLOWED_SORTS,
    );

    // Remove auto-added deletedAt filter (AuditLog has no deletedAt)
    delete where.deletedAt;

    const finalOrderBy = orderBy.length > 0 ? orderBy : [{ createdAt: 'desc' }];

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: finalOrderBy,
        skip,
        take,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return ServiceResult.ok(paginate(items, total, query));
  }
}

export function maskSensitiveData(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(maskSensitiveData);

  const masked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (SENSITIVE_FIELDS.includes(key)) {
      masked[key] = REDACTED;
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskSensitiveData(value);
    } else {
      masked[key] = value;
    }
  }
  return masked;
}
