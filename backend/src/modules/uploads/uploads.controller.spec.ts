import { Test, TestingModule } from '@nestjs/testing';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { ServiceResult } from '../../common/types';
import { Reflector } from '@nestjs/core';

// Mock RequestContext for @CurrentTenant
jest.mock('../../common/services/request-context', () => ({
  RequestContext: {
    get tenantId() {
      return 'tenant-1';
    },
  },
}));

const makeFile = (overrides: Partial<Express.Multer.File> = {}): Express.Multer.File => ({
  fieldname: 'file',
  originalname: 'test-photo.jpg',
  encoding: '7bit',
  mimetype: 'image/jpeg',
  buffer: Buffer.from('fake-content'),
  size: 1024,
  stream: null as any,
  destination: '',
  filename: '',
  path: '',
  ...overrides,
});

describe('UploadsController', () => {
  let controller: UploadsController;
  let serviceMock: Record<string, jest.Mock>;

  beforeEach(async () => {
    serviceMock = {
      upload: jest.fn(),
      getPresignedUrl: jest.fn(),
      getUploadUrl: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadsController],
      providers: [
        { provide: UploadsService, useValue: serviceMock },
        Reflector,
      ],
    }).compile();

    controller = module.get<UploadsController>(UploadsController);
  });

  describe('upload', () => {
    it('should return upload result on success', async () => {
      const uploadResult = { key: 'tenant-1/images/uuid-photo.jpg', url: 'http://localhost:9000/bucket/...' };
      serviceMock.upload.mockResolvedValue(ServiceResult.ok(uploadResult));

      const result = await controller.upload('tenant-1', makeFile(), { folder: 'images' });

      expect(result).toEqual(uploadResult);
      expect(serviceMock.upload).toHaveBeenCalledWith('tenant-1', 'images', expect.any(Object));
    });

    it('should throw when no file provided', async () => {
      await expect(
        controller.upload('tenant-1', undefined as any, { folder: 'images' }),
      ).rejects.toThrow();
    });

    it('should throw on service failure', async () => {
      serviceMock.upload.mockResolvedValue(
        ServiceResult.fail('VALIDATION_ERROR', 'File too large'),
      );

      await expect(
        controller.upload('tenant-1', makeFile(), { folder: 'images' }),
      ).rejects.toThrow();
    });
  });

  describe('getUploadUrl', () => {
    it('should return presigned upload URL', async () => {
      const presignedResult = { uploadUrl: 'https://upload-url', key: 'tenant-1/docs/uuid-file.pdf' };
      serviceMock.getUploadUrl.mockResolvedValue(ServiceResult.ok(presignedResult));

      const result = await controller.getUploadUrl('tenant-1', {
        folder: 'docs',
        filename: 'file.pdf',
        contentType: 'application/pdf',
      });

      expect(result).toEqual(presignedResult);
    });
  });

  describe('getPresignedUrl', () => {
    it('should return presigned read URL', async () => {
      serviceMock.getPresignedUrl.mockResolvedValue(ServiceResult.ok('https://signed-url'));

      const result = await controller.getPresignedUrl('tenant-1', 'tenant-1/images/abc.jpg');

      expect(result).toEqual({ url: 'https://signed-url' });
    });

    it('should throw when accessing other tenant file', async () => {
      serviceMock.getPresignedUrl.mockResolvedValue(
        ServiceResult.fail('FORBIDDEN', 'Access denied'),
      );

      await expect(
        controller.getPresignedUrl('tenant-1', 'tenant-2/images/abc.jpg'),
      ).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete file successfully', async () => {
      serviceMock.delete.mockResolvedValue(ServiceResult.ok(undefined));

      const result = await controller.delete('tenant-1', 'tenant-1/images/abc.jpg');

      expect(result).toEqual({ deleted: true });
    });
  });
});
