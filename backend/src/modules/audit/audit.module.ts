import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditController, AdminAuditController } from './audit.controller';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AuditController, AdminAuditController],
  providers: [AuditService, AuditInterceptor],
  exports: [AuditService, AuditInterceptor],
})
export class AuditModule {}
