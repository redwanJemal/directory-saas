import { Module } from '@nestjs/common';
import { AdminTenantsController } from './admin-tenants.controller';
import { TenantSelfController } from './tenant-self.controller';
import { TenantsService } from './tenants.service';
import { TenantSelfService } from './tenant-self.service';

@Module({
  controllers: [AdminTenantsController, TenantSelfController],
  providers: [TenantsService, TenantSelfService],
  exports: [TenantsService, TenantSelfService],
})
export class TenantsModule {}
