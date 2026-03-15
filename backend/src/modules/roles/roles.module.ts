import { Module, OnModuleInit } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController, UserRolesController } from './roles.controller';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  controllers: [RolesController, UserRolesController],
  providers: [RolesService, RolesGuard],
  exports: [RolesService, RolesGuard],
})
export class RolesModule implements OnModuleInit {
  constructor(private readonly rolesService: RolesService) {}

  async onModuleInit(): Promise<void> {
    await this.rolesService.seedPermissions();
  }
}
