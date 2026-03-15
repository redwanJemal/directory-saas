import { Module } from '@nestjs/common';
import { AppConfigModule } from '../../config/app-config.module';
import { StorageService } from '../../common/services/storage.service';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

@Module({
  imports: [AppConfigModule],
  controllers: [UploadsController],
  providers: [StorageService, UploadsService],
  exports: [StorageService, UploadsService],
})
export class UploadsModule {}
