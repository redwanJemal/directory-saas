import { Module } from '@nestjs/common';
import { AdminTenantsController } from './admin-tenants.controller';
import { AdminDashboardController } from './admin-dashboard.controller';
import { TenantSelfController } from './tenant-self.controller';
import { TenantsService } from './tenants.service';
import { TenantSelfService } from './tenant-self.service';
import { AdminDashboardService } from './admin-dashboard.service';

@Module({
  controllers: [AdminTenantsController, AdminDashboardController, TenantSelfController],
  providers: [TenantsService, TenantSelfService, AdminDashboardService],
  exports: [TenantsService, TenantSelfService, AdminDashboardService],
})
export class TenantsModule {}
