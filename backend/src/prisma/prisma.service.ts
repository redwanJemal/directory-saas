import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { RequestContext } from '../common/services/request-context';
import { withRLS, withRLSBypass, RLSExtendedClient } from './prisma-rls.extension';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Returns a Prisma client scoped to the current tenant from RequestContext.
   * Queries on RLS-protected tables will be wrapped in a transaction that
   * sets `app.current_tenant_id` before executing.
   *
   * Falls back to the base client (no RLS context) if no tenantId is available.
   */
  get rls(): RLSExtendedClient {
    const tenantId = RequestContext.tenantId;
    if (!tenantId) {
      return this as unknown as RLSExtendedClient;
    }
    return withRLS(this as PrismaClient, tenantId);
  }

  /**
   * Returns a Prisma client that bypasses RLS for admin/platform queries.
   * Sets `app.bypass_rls = 'on'` so all RLS policies allow access.
   */
  get rlsBypass(): RLSExtendedClient {
    return withRLSBypass(this as PrismaClient);
  }

  /**
   * Returns a Prisma client scoped to a specific tenant ID.
   * Use when the tenant ID is known but not in RequestContext
   * (e.g., background jobs, migrations).
   */
  forTenant(tenantId: string): RLSExtendedClient {
    return withRLS(this as PrismaClient, tenantId);
  }
}
