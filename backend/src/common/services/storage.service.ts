import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AppConfigService } from '../../config/app-config.service';
import { randomUUID } from 'crypto';

const DEFAULT_PRESIGN_EXPIRY = 3600; // 1 hour

export interface UploadResult {
  key: string;
  url: string;
}

export interface PresignedUploadResult {
  uploadUrl: string;
  key: string;
}

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly endpoint: string;

  constructor(private readonly config: AppConfigService) {
    const s3Config = this.config.s3;
    this.bucket = s3Config.bucket;
    this.endpoint = s3Config.endpoint;

    this.s3 = new S3Client({
      endpoint: s3Config.endpoint,
      region: s3Config.region,
      credentials: {
        accessKeyId: s3Config.accessKey,
        secretAccessKey: s3Config.secretKey,
      },
      forcePathStyle: true, // Required for MinIO
    });
  }

  async onModuleInit(): Promise<void> {
    await this.ensureBucket();
  }

  /**
   * Upload a file with a tenant-scoped key.
   */
  async upload(
    tenantId: string,
    folder: string,
    file: { buffer: Buffer; originalname: string; mimetype: string },
  ): Promise<UploadResult> {
    const key = this.buildKey(tenantId, folder, file.originalname);

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    const url = `${this.endpoint}/${this.bucket}/${key}`;
    return { key, url };
  }

  /**
   * Get a presigned read URL (default 1h expiry).
   */
  async getPresignedUrl(
    key: string,
    expirySeconds: number = DEFAULT_PRESIGN_EXPIRY,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3, command, { expiresIn: expirySeconds });
  }

  /**
   * Get a presigned upload URL for direct client upload.
   */
  async getUploadUrl(
    tenantId: string,
    folder: string,
    filename: string,
    contentType: string,
  ): Promise<PresignedUploadResult> {
    const key = this.buildKey(tenantId, folder, filename);

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3, command, {
      expiresIn: DEFAULT_PRESIGN_EXPIRY,
    });

    return { uploadUrl, key };
  }

  /**
   * Delete a single file by key.
   */
  async delete(key: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  /**
   * Delete all files for a tenant.
   */
  async deleteTenantFiles(tenantId: string): Promise<void> {
    const prefix = `${tenantId}/`;
    let continuationToken: string | undefined;

    do {
      const response = await this.s3.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      );

      if (response.Contents) {
        await Promise.all(
          response.Contents.map((obj) =>
            this.s3.send(
              new DeleteObjectCommand({
                Bucket: this.bucket,
                Key: obj.Key!,
              }),
            ),
          ),
        );
      }

      continuationToken = response.IsTruncated
        ? response.NextContinuationToken
        : undefined;
    } while (continuationToken);
  }

  /**
   * Build a tenant-scoped storage key.
   * Format: {tenantId}/{folder}/{uuid}-{originalName}
   */
  private buildKey(
    tenantId: string,
    folder: string,
    originalName: string,
  ): string {
    const sanitized = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${tenantId}/${folder}/${randomUUID()}-${sanitized}`;
  }

  private async ensureBucket(): Promise<void> {
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      try {
        await this.s3.send(new CreateBucketCommand({ Bucket: this.bucket }));
        this.logger.log(`Created bucket: ${this.bucket}`);
      } catch (createErr) {
        this.logger.warn(
          `Could not create bucket "${this.bucket}": ${(createErr as Error).message}`,
        );
      }
    }
  }
}
