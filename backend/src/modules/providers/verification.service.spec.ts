import { VerificationService } from './verification.service';

describe('VerificationService', () => {
  let service: VerificationService;
  let prisma: any;

  const tenantId = 'tenant-uuid-1';
  const profileId = 'profile-uuid-1';
  const requestId = 'request-uuid-1';
  const reviewerId = 'admin-uuid-1';

  const mockProfile = {
    id: profileId,
    tenantId,
    isVerified: false,
    verifiedAt: null,
  };

  const mockVerificationRequest = {
    id: requestId,
    providerProfileId: profileId,
    status: 'pending',
    tradeLicenseUrl: 'https://example.com/license.pdf',
    documentUrls: ['https://example.com/doc1.pdf'],
    notes: 'Please verify my business',
    adminNotes: null,
    reviewedBy: null,
    reviewedAt: null,
    createdAt: new Date('2026-03-18T00:00:00Z'),
    updatedAt: new Date('2026-03-18T00:00:00Z'),
  };

  beforeEach(() => {
    prisma = {
      providerProfile: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      verificationRequest: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    service = new VerificationService(prisma);
  });

  describe('submitVerification', () => {
    it('should create a verification request', async () => {
      prisma.providerProfile.findUnique.mockResolvedValue(mockProfile);
      prisma.verificationRequest.findFirst.mockResolvedValue(null);
      prisma.verificationRequest.create.mockResolvedValue(mockVerificationRequest);

      const result = await service.submitVerification(tenantId, {
        tradeLicenseUrl: 'https://example.com/license.pdf',
        documentUrls: ['https://example.com/doc1.pdf'],
        notes: 'Please verify my business',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockVerificationRequest);
      expect(prisma.verificationRequest.create).toHaveBeenCalledWith({
        data: {
          providerProfileId: profileId,
          tradeLicenseUrl: 'https://example.com/license.pdf',
          documentUrls: ['https://example.com/doc1.pdf'],
          notes: 'Please verify my business',
        },
      });
    });

    it('should fail if profile not found', async () => {
      prisma.providerProfile.findUnique.mockResolvedValue(null);

      const result = await service.submitVerification(tenantId, {
        documentUrls: [],
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });

    it('should fail if already verified', async () => {
      prisma.providerProfile.findUnique.mockResolvedValue({
        ...mockProfile,
        isVerified: true,
      });

      const result = await service.submitVerification(tenantId, {
        documentUrls: [],
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CONFLICT');
      expect(result.error?.message).toContain('already verified');
    });

    it('should fail if pending request exists', async () => {
      prisma.providerProfile.findUnique.mockResolvedValue(mockProfile);
      prisma.verificationRequest.findFirst.mockResolvedValue(mockVerificationRequest);

      const result = await service.submitVerification(tenantId, {
        documentUrls: [],
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CONFLICT');
      expect(result.error?.message).toContain('already pending');
    });
  });

  describe('getVerificationStatus', () => {
    it('should return verification status with latest request', async () => {
      prisma.providerProfile.findUnique.mockResolvedValue(mockProfile);
      prisma.verificationRequest.findFirst.mockResolvedValue(mockVerificationRequest);

      const result = await service.getVerificationStatus(tenantId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        isVerified: false,
        verifiedAt: null,
        latestRequest: {
          id: requestId,
          status: 'pending',
          adminNotes: null,
          reviewedAt: null,
          createdAt: mockVerificationRequest.createdAt,
        },
      });
    });

    it('should return null latestRequest when no requests exist', async () => {
      prisma.providerProfile.findUnique.mockResolvedValue(mockProfile);
      prisma.verificationRequest.findFirst.mockResolvedValue(null);

      const result = await service.getVerificationStatus(tenantId);

      expect(result.success).toBe(true);
      expect((result.data as any).latestRequest).toBeNull();
    });

    it('should fail if profile not found', async () => {
      prisma.providerProfile.findUnique.mockResolvedValue(null);

      const result = await service.getVerificationStatus(tenantId);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });
  });

  describe('listVerificationRequests', () => {
    it('should return paginated list of requests', async () => {
      const items = [mockVerificationRequest];
      prisma.verificationRequest.findMany.mockResolvedValue(items);
      prisma.verificationRequest.count.mockResolvedValue(1);

      const result = await service.listVerificationRequests(1, 20);

      expect(result.success).toBe(true);
      expect((result.data as any).items).toEqual(items);
      expect((result.data as any).total).toBe(1);
    });

    it('should filter by status', async () => {
      prisma.verificationRequest.findMany.mockResolvedValue([]);
      prisma.verificationRequest.count.mockResolvedValue(0);

      await service.listVerificationRequests(1, 20, { status: 'pending' });

      expect(prisma.verificationRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'pending' },
        }),
      );
    });
  });

  describe('reviewVerification', () => {
    it('should approve a verification request and update profile', async () => {
      prisma.verificationRequest.findUnique.mockResolvedValue(mockVerificationRequest);

      const updatedRequest = {
        ...mockVerificationRequest,
        status: 'approved',
        adminNotes: 'Looks good',
        reviewedBy: reviewerId,
        reviewedAt: expect.any(Date),
      };

      prisma.$transaction.mockImplementation(async (fn: Function) => {
        const tx = {
          verificationRequest: {
            update: jest.fn().mockResolvedValue(updatedRequest),
          },
          providerProfile: {
            update: jest.fn().mockResolvedValue({ ...mockProfile, isVerified: true }),
          },
        };
        return fn(tx);
      });

      const result = await service.reviewVerification(requestId, reviewerId, {
        status: 'approved',
        adminNotes: 'Looks good',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedRequest);
    });

    it('should reject a verification request without updating profile', async () => {
      prisma.verificationRequest.findUnique.mockResolvedValue(mockVerificationRequest);

      const updatedRequest = {
        ...mockVerificationRequest,
        status: 'rejected',
        adminNotes: 'Missing documents',
        reviewedBy: reviewerId,
        reviewedAt: expect.any(Date),
      };

      prisma.$transaction.mockImplementation(async (fn: Function) => {
        const tx = {
          verificationRequest: {
            update: jest.fn().mockResolvedValue(updatedRequest),
          },
          providerProfile: {
            update: jest.fn(),
          },
        };
        return fn(tx);
      });

      const result = await service.reviewVerification(requestId, reviewerId, {
        status: 'rejected',
        adminNotes: 'Missing documents',
      });

      expect(result.success).toBe(true);
    });

    it('should fail if request not found', async () => {
      prisma.verificationRequest.findUnique.mockResolvedValue(null);

      const result = await service.reviewVerification(requestId, reviewerId, {
        status: 'approved',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });

    it('should fail if request already reviewed', async () => {
      prisma.verificationRequest.findUnique.mockResolvedValue({
        ...mockVerificationRequest,
        status: 'approved',
      });

      const result = await service.reviewVerification(requestId, reviewerId, {
        status: 'approved',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CONFLICT');
    });
  });
});
