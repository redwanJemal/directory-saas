import { Injectable, Logger } from '@nestjs/common';
import { StorageService, UploadResult, PresignedUploadResult } from '../../common/services/storage.service';
import { ServiceResult } from '../../common/types';
import {
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE,
} from './dto/presigned-upload.dto';
import { extname } from 'path';

const MIME_TO_EXTENSIONS: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
};

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(private readonly storage: StorageService) {}

  async upload(
    tenantId: string,
    folder: string,
    file: Express.Multer.File,
  ): Promise<ServiceResult<UploadResult>> {
    const validation = this.validateFile(file);
    if (!validation.success) {
      return validation as ServiceResult<UploadResult>;
    }

    try {
      const result = await this.storage.upload(tenantId, folder, file);
      return ServiceResult.ok(result);
    } catch (err) {
      this.logger.error(`Upload failed: ${(err as Error).message}`);
      return ServiceResult.fail('INTERNAL_ERROR', 'File upload failed');
    }
  }

  async getPresignedUrl(
    tenantId: string,
    key: string,
    expirySeconds?: number,
  ): Promise<ServiceResult<string>> {
    if (!key.startsWith(`${tenantId}/`)) {
      return ServiceResult.fail('FORBIDDEN', 'Access denied to this file');
    }

    try {
      const url = await this.storage.getPresignedUrl(key, expirySeconds);
      return ServiceResult.ok(url);
    } catch (err) {
      this.logger.error(`Presigned URL generation failed: ${(err as Error).message}`);
      return ServiceResult.fail('INTERNAL_ERROR', 'Failed to generate presigned URL');
    }
  }

  async getUploadUrl(
    tenantId: string,
    folder: string,
    filename: string,
    contentType: string,
  ): Promise<ServiceResult<PresignedUploadResult>> {
    try {
      const result = await this.storage.getUploadUrl(
        tenantId,
        folder,
        filename,
        contentType,
      );
      return ServiceResult.ok(result);
    } catch (err) {
      this.logger.error(`Upload URL generation failed: ${(err as Error).message}`);
      return ServiceResult.fail('INTERNAL_ERROR', 'Failed to generate upload URL');
    }
  }

  async delete(
    tenantId: string,
    key: string,
  ): Promise<ServiceResult<void>> {
    if (!key.startsWith(`${tenantId}/`)) {
      return ServiceResult.fail('FORBIDDEN', 'Access denied to this file');
    }

    try {
      await this.storage.delete(key);
      return ServiceResult.ok(undefined as void);
    } catch (err) {
      this.logger.error(`Delete failed: ${(err as Error).message}`);
      return ServiceResult.fail('INTERNAL_ERROR', 'File deletion failed');
    }
  }

  async deleteTenantFiles(tenantId: string): Promise<ServiceResult<void>> {
    try {
      await this.storage.deleteTenantFiles(tenantId);
      return ServiceResult.ok(undefined as void);
    } catch (err) {
      this.logger.error(`Tenant file cleanup failed: ${(err as Error).message}`);
      return ServiceResult.fail('INTERNAL_ERROR', 'Tenant file cleanup failed');
    }
  }

  private validateFile(file: Express.Multer.File): ServiceResult<void> {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return ServiceResult.fail(
        'VALIDATION_ERROR',
        `File size exceeds maximum of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      );
    }

    // Check MIME type is allowed
    if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.mimetype)) {
      return ServiceResult.fail(
        'VALIDATION_ERROR',
        `File type "${file.mimetype}" is not allowed`,
      );
    }

    // Check extension
    const ext = extname(file.originalname).toLowerCase();
    if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
      return ServiceResult.fail(
        'VALIDATION_ERROR',
        `File extension "${ext}" is not allowed`,
      );
    }

    // Validate MIME type matches extension
    const allowedExts = MIME_TO_EXTENSIONS[file.mimetype];
    if (allowedExts && !allowedExts.includes(ext)) {
      return ServiceResult.fail(
        'VALIDATION_ERROR',
        `File extension "${ext}" does not match content type "${file.mimetype}"`,
      );
    }

    return ServiceResult.ok(undefined as void);
  }
}
