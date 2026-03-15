import { Test, TestingModule } from '@nestjs/testing';
import { UploadsService } from './uploads.service';
import { StorageService } from '../../common/services/storage.service';

const makeFile = (overrides: Partial<Express.Multer.File> = {}): Express.Multer.File => ({
  fieldname: 'file',
  originalname: 'test-photo.jpg',
  encoding: '7bit',
  mimetype: 'image/jpeg',
  buffer: Buffer.from('fake-image-content'),
  size: 1024,
  stream: null as any,
  destination: '',
  filename: '',
  path: '',
  ...overrides,
});

describe('UploadsService', () => {
  let service: UploadsService;
  let storageMock: Record<string, jest.Mock>;

  beforeEach(async () => {
    storageMock = {
      upload: jest.fn().mockResolvedValue({ key: 'tenant-1/images/uuid-photo.jpg', url: 'http://localhost:9000/bucket/tenant-1/images/uuid-photo.jpg' }),
      getPresignedUrl: jest.fn().mockResolvedValue('https://signed-url'),
      getUploadUrl: jest.fn().mockResolvedValue({ uploadUrl: 'https://upload-url', key: 'tenant-1/docs/uuid-report.pdf' }),
      delete: jest.fn().mockResolvedValue(undefined),
      deleteTenantFiles: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadsService,
        { provide: StorageService, useValue: storageMock },
      ],
    }).compile();

    service = module.get<UploadsService>(UploadsService);
  });

  describe('upload', () => {
    it('should upload file with correct tenant-scoped key', async () => {
      const file = makeFile();
      const result = await service.upload('tenant-1', 'images', file);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('key');
      expect(result.data).toHaveProperty('url');
      expect(storageMock.upload).toHaveBeenCalledWith('tenant-1', 'images', file);
    });

    it('should reject file exceeding size limit', async () => {
      const file = makeFile({ size: 11 * 1024 * 1024 }); // 11MB
      const result = await service.upload('tenant-1', 'images', file);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.message).toContain('size');
    });

    it('should reject invalid MIME type', async () => {
      const file = makeFile({ mimetype: 'application/x-executable' });
      const result = await service.upload('tenant-1', 'images', file);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.message).toContain('not allowed');
    });

    it('should reject disallowed file extension', async () => {
      const file = makeFile({
        originalname: 'malware.exe',
        mimetype: 'image/jpeg', // Trying to spoof
      });
      const result = await service.upload('tenant-1', 'images', file);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.message).toContain('extension');
    });

    it('should reject MIME type that does not match extension', async () => {
      const file = makeFile({
        originalname: 'file.png',
        mimetype: 'image/jpeg', // jpg mime but .png extension
      });
      const result = await service.upload('tenant-1', 'images', file);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.message).toContain('does not match');
    });

    it('should accept valid PDF file', async () => {
      const file = makeFile({
        originalname: 'document.pdf',
        mimetype: 'application/pdf',
        size: 5 * 1024 * 1024,
      });
      const result = await service.upload('tenant-1', 'documents', file);

      expect(result.success).toBe(true);
    });

    it('should handle storage errors gracefully', async () => {
      storageMock.upload.mockRejectedValue(new Error('S3 connection failed'));
      const file = makeFile();
      const result = await service.upload('tenant-1', 'images', file);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('getPresignedUrl', () => {
    it('should return presigned URL for own tenant file', async () => {
      const result = await service.getPresignedUrl('tenant-1', 'tenant-1/images/uuid-photo.jpg');

      expect(result.success).toBe(true);
      expect(result.data).toBe('https://signed-url');
    });

    it('should deny access to another tenant files', async () => {
      const result = await service.getPresignedUrl('tenant-1', 'tenant-2/images/uuid-photo.jpg');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FORBIDDEN');
    });
  });

  describe('getUploadUrl', () => {
    it('should return presigned upload URL', async () => {
      const result = await service.getUploadUrl(
        'tenant-1',
        'documents',
        'report.pdf',
        'application/pdf',
      );

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('uploadUrl');
      expect(result.data).toHaveProperty('key');
    });
  });

  describe('delete', () => {
    it('should delete own tenant file', async () => {
      const result = await service.delete('tenant-1', 'tenant-1/images/uuid-photo.jpg');

      expect(result.success).toBe(true);
      expect(storageMock.delete).toHaveBeenCalledWith('tenant-1/images/uuid-photo.jpg');
    });

    it('should deny deleting another tenant file', async () => {
      const result = await service.delete('tenant-1', 'tenant-2/images/uuid-photo.jpg');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FORBIDDEN');
      expect(storageMock.delete).not.toHaveBeenCalled();
    });
  });

  describe('deleteTenantFiles', () => {
    it('should delete all files for a tenant', async () => {
      const result = await service.deleteTenantFiles('tenant-1');

      expect(result.success).toBe(true);
      expect(storageMock.deleteTenantFiles).toHaveBeenCalledWith('tenant-1');
    });
  });
});
