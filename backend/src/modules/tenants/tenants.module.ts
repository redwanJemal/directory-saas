import { Module } from '@nestjs/common';
import { AdminTenantsController } from './admin-tenants.controller';
import { TenantsService } from './tenants.service';

@Module({
  controllers: [AdminTenantsController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}
