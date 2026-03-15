import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { UploadsService } from './uploads.service';
import {
  PresignedUploadSchema,
  PresignedUploadDto,
  MAX_FILE_SIZE,
} from './dto/presigned-upload.dto';
import {
  UploadFileSchema,
  UploadFileDto,
} from './dto/upload-file.dto';

@ApiTags('Uploads')
@Controller('api/v1/uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  async upload(
    @CurrentTenant() tenantId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body(new ZodValidationPipe(UploadFileSchema)) dto: UploadFileDto,
  ) {
    if (!file) {
      const { AppException } = await import('../../common/exceptions/app.exception');
      throw new AppException('VALIDATION_ERROR', 'File is required');
    }

    const result = await this.uploadsService.upload(tenantId, dto.folder, file);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Post('presigned')
  @HttpCode(HttpStatus.CREATED)
  async getUploadUrl(
    @CurrentTenant() tenantId: string,
    @Body(new ZodValidationPipe(PresignedUploadSchema)) dto: PresignedUploadDto,
  ) {
    const result = await this.uploadsService.getUploadUrl(
      tenantId,
      dto.folder,
      dto.filename,
      dto.contentType,
    );
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Get('presigned/:key(*)')
  async getPresignedUrl(
    @CurrentTenant() tenantId: string,
    @Param('key') key: string,
  ) {
    const result = await this.uploadsService.getPresignedUrl(tenantId, key);
    if (!result.success) throw result.toHttpException();
    return { url: result.data };
  }

  @Delete(':key(*)')
  @HttpCode(HttpStatus.OK)
  async delete(
    @CurrentTenant() tenantId: string,
    @Param('key') key: string,
  ) {
    const result = await this.uploadsService.delete(tenantId, key);
    if (!result.success) throw result.toHttpException();
    return { deleted: true };
  }
}
