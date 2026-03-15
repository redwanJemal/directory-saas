import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';
import { AppConfigService } from '../../config/app-config.service';

// Mock the AWS SDK modules
const mockSend = jest.fn();
jest.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: jest.fn().mockImplementation(() => ({
      send: mockSend,
    })),
    PutObjectCommand: jest.fn().mockImplementation((input) => ({ ...input, _type: 'PutObject' })),
    GetObjectCommand: jest.fn().mockImplementation((input) => ({ ...input, _type: 'GetObject' })),
    DeleteObjectCommand: jest.fn().mockImplementation((input) => ({ ...input, _type: 'DeleteObject' })),
    ListObjectsV2Command: jest.fn().mockImplementation((input) => ({ ...input, _type: 'ListObjectsV2' })),
    HeadBucketCommand: jest.fn().mockImplementation((input) => ({ ...input, _type: 'HeadBucket' })),
    CreateBucketCommand: jest.fn().mockImplementation((input) => ({ ...input, _type: 'CreateBucket' })),
  };
});

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://minio:9000/signed-url'),
}));

const mockConfigService = {
  s3: {
    endpoint: 'http://localhost:9000',
    accessKey: 'minioadmin',
    secretKey: 'minioadmin',
    bucket: 'test-bucket',
    region: 'us-east-1',
  },
};

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    mockSend.mockReset();
    // Default: bucket exists
    mockSend.mockResolvedValue({});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        { provide: AppConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  describe('upload', () => {
    it('should upload file with tenant-scoped key', async () => {
      mockSend.mockResolvedValue({});

      const file = {
        buffer: Buffer.from('test-content'),
        originalname: 'photo.jpg',
        mimetype: 'image/jpeg',
      };

      const result = await service.upload('tenant-1', 'images', file);

      expect(result.key).toMatch(/^tenant-1\/images\/[a-f0-9-]+-photo\.jpg$/);
      expect(result.url).toContain('http://localhost:9000/test-bucket/tenant-1/images/');
      expect(mockSend).toHaveBeenCalled();
    });

    it('should sanitize filenames with special characters', async () => {
      mockSend.mockResolvedValue({});

      const file = {
        buffer: Buffer.from('test'),
        originalname: 'my photo (1).jpg',
        mimetype: 'image/jpeg',
      };

      const result = await service.upload('tenant-1', 'images', file);

      expect(result.key).toMatch(/^tenant-1\/images\/[a-f0-9-]+-my_photo__1_.jpg$/);
    });
  });

  describe('getPresignedUrl', () => {
    it('should return a presigned URL', async () => {
      const url = await service.getPresignedUrl('tenant-1/images/abc.jpg');

      expect(url).toBe('https://minio:9000/signed-url');
    });

    it('should accept custom expiry', async () => {
      const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

      await service.getPresignedUrl('tenant-1/images/abc.jpg', 600);

      expect(getSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { expiresIn: 600 },
      );
    });
  });

  describe('getUploadUrl', () => {
    it('should return presigned upload URL with correct key', async () => {
      const result = await service.getUploadUrl(
        'tenant-1',
        'documents',
        'report.pdf',
        'application/pdf',
      );

      expect(result.uploadUrl).toBe('https://minio:9000/signed-url');
      expect(result.key).toMatch(/^tenant-1\/documents\/[a-f0-9-]+-report\.pdf$/);
    });
  });

  describe('delete', () => {
    it('should send delete command', async () => {
      mockSend.mockResolvedValue({});

      await service.delete('tenant-1/images/abc.jpg');

      expect(mockSend).toHaveBeenCalled();
    });
  });

  describe('deleteTenantFiles', () => {
    it('should list and delete all files for a tenant', async () => {
      mockSend
        .mockResolvedValueOnce({
          Contents: [
            { Key: 'tenant-1/images/a.jpg' },
            { Key: 'tenant-1/images/b.jpg' },
          ],
          IsTruncated: false,
        })
        .mockResolvedValue({});

      await service.deleteTenantFiles('tenant-1');

      // 1 list + 2 deletes
      expect(mockSend).toHaveBeenCalledTimes(3);
    });

    it('should handle paginated results', async () => {
      mockSend
        .mockResolvedValueOnce({
          Contents: [{ Key: 'tenant-1/a.jpg' }],
          IsTruncated: true,
          NextContinuationToken: 'token-2',
        })
        .mockResolvedValueOnce({}) // delete first file
        .mockResolvedValueOnce({
          Contents: [{ Key: 'tenant-1/b.jpg' }],
          IsTruncated: false,
        })
        .mockResolvedValue({});

      await service.deleteTenantFiles('tenant-1');

      // 2 lists + 2 deletes
      expect(mockSend).toHaveBeenCalledTimes(4);
    });
  });

  describe('onModuleInit', () => {
    it('should create bucket if it does not exist', async () => {
      mockSend
        .mockRejectedValueOnce(new Error('NotFound')) // HeadBucket fails
        .mockResolvedValueOnce({}); // CreateBucket succeeds

      await service.onModuleInit();

      expect(mockSend).toHaveBeenCalledTimes(2);
    });
  });
});
