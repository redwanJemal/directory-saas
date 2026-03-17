import { ContactClickService } from './contact-click.service';

describe('ContactClickService', () => {
  let service: ContactClickService;
  let prisma: any;

  const profileId = 'profile-uuid-1';

  const mockProfile = {
    id: profileId,
    tenantId: 'tenant-uuid-1',
    whatsapp: '+971501234567',
    whatsappMessage: null,
    phone: '+971 50 123 4567',
    email: 'test@example.com',
    website: 'https://example.com',
    instagram: '@testbiz',
  };

  beforeEach(() => {
    prisma = {
      providerProfile: {
        findUnique: jest.fn(),
      },
      contactClick: {
        create: jest.fn().mockResolvedValue({}),
        groupBy: jest.fn().mockResolvedValue([]),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    service = new ContactClickService(prisma);
  });

  // === WhatsApp URL Formatting ===

  describe('formatWhatsAppNumber', () => {
    it('should preserve international format with +', () => {
      expect(service.formatWhatsAppNumber('+971501234567')).toBe('+971501234567');
    });

    it('should strip spaces and dashes', () => {
      expect(service.formatWhatsAppNumber('+971 50 123 4567')).toBe('+971501234567');
      expect(service.formatWhatsAppNumber('+971-50-123-4567')).toBe('+971501234567');
    });

    it('should strip parentheses', () => {
      expect(service.formatWhatsAppNumber('+971(50)1234567')).toBe('+971501234567');
    });

    it('should replace 00 prefix with +', () => {
      expect(service.formatWhatsAppNumber('00971501234567')).toBe('+971501234567');
    });

    it('should add + prefix if missing', () => {
      expect(service.formatWhatsAppNumber('971501234567')).toBe('+971501234567');
    });
  });

  describe('generateWhatsAppUrl', () => {
    it('should generate correct wa.me URL with default message', () => {
      const url = service.generateWhatsAppUrl('+971501234567');
      expect(url).toContain('https://wa.me/971501234567');
      expect(url).toContain('text=');
      expect(url).toContain('Habesha%20Hub');
    });

    it('should use custom message when provided', () => {
      const url = service.generateWhatsAppUrl('+971501234567', 'Hello there!');
      expect(url).toBe('https://wa.me/971501234567?text=Hello%20there!');
    });

    it('should use default message when custom is null', () => {
      const url = service.generateWhatsAppUrl('+971501234567', null);
      expect(url).toContain('Habesha%20Hub');
    });

    it('should handle number with spaces', () => {
      const url = service.generateWhatsAppUrl('+971 50 123 4567');
      expect(url).toContain('https://wa.me/971501234567');
    });
  });

  describe('generateContactUrl', () => {
    it('should generate WhatsApp URL for whatsapp type', () => {
      const url = service.generateContactUrl('whatsapp', mockProfile);
      expect(url).toContain('https://wa.me/971501234567');
    });

    it('should use custom whatsappMessage if set', () => {
      const url = service.generateContactUrl('whatsapp', {
        ...mockProfile,
        whatsappMessage: 'Custom greeting',
      });
      expect(url).toContain('Custom%20greeting');
    });

    it('should return null for whatsapp when number is empty', () => {
      const url = service.generateContactUrl('whatsapp', { ...mockProfile, whatsapp: null });
      expect(url).toBeNull();
    });

    it('should generate tel: URL for phone type', () => {
      const url = service.generateContactUrl('phone', mockProfile);
      expect(url).toBe('tel:+971501234567');
    });

    it('should generate mailto: URL for email type', () => {
      const url = service.generateContactUrl('email', mockProfile);
      expect(url).toBe('mailto:test@example.com');
    });

    it('should return website URL directly for website type', () => {
      const url = service.generateContactUrl('website', mockProfile);
      expect(url).toBe('https://example.com');
    });

    it('should generate Instagram URL from handle', () => {
      const url = service.generateContactUrl('instagram', mockProfile);
      expect(url).toBe('https://instagram.com/testbiz');
    });

    it('should return full Instagram URL if already provided', () => {
      const url = service.generateContactUrl('instagram', {
        ...mockProfile,
        instagram: 'https://instagram.com/mybiz',
      });
      expect(url).toBe('https://instagram.com/mybiz');
    });

    it('should return null for missing contact info', () => {
      const emptyProfile = {
        whatsapp: null,
        phone: null,
        email: null,
        website: null,
        instagram: null,
      };
      expect(service.generateContactUrl('whatsapp', emptyProfile)).toBeNull();
      expect(service.generateContactUrl('phone', emptyProfile)).toBeNull();
      expect(service.generateContactUrl('email', emptyProfile)).toBeNull();
      expect(service.generateContactUrl('website', emptyProfile)).toBeNull();
      expect(service.generateContactUrl('instagram', emptyProfile)).toBeNull();
    });
  });

  // === Contact Click Recording ===

  describe('recordClick', () => {
    it('should record a click and return the contact URL', async () => {
      prisma.providerProfile.findUnique.mockResolvedValue(mockProfile);

      const result = await service.recordClick(profileId, 'whatsapp', {
        ipAddress: '1.2.3.4',
        userAgent: 'Mozilla/5.0',
      });

      expect(result.success).toBe(true);
      expect(result.data?.url).toContain('https://wa.me/971501234567');
      expect(prisma.contactClick.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          providerProfileId: profileId,
          type: 'whatsapp',
          ipAddress: '1.2.3.4',
          userAgent: 'Mozilla/5.0',
        }),
      });
    });

    it('should return NOT_FOUND for non-existent provider', async () => {
      prisma.providerProfile.findUnique.mockResolvedValue(null);

      const result = await service.recordClick('non-existent', 'whatsapp');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });

    it('should not fail if click recording fails', async () => {
      prisma.providerProfile.findUnique.mockResolvedValue(mockProfile);
      prisma.contactClick.create.mockRejectedValue(new Error('DB error'));

      const result = await service.recordClick(profileId, 'email');

      expect(result.success).toBe(true);
      expect(result.data?.url).toBe('mailto:test@example.com');
    });
  });

  // === Analytics ===

  describe('getClickStats', () => {
    it('should return aggregated stats by type', async () => {
      prisma.contactClick.groupBy.mockResolvedValue([
        { type: 'whatsapp', _count: { id: 15 } },
        { type: 'phone', _count: { id: 8 } },
        { type: 'email', _count: { id: 3 } },
      ]);

      const result = await service.getClickStats(profileId, 30);

      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.total).toBe(26);
      expect(data.byType.whatsapp).toBe(15);
      expect(data.byType.phone).toBe(8);
      expect(data.byType.email).toBe(3);
      expect(data.period).toBe('30d');
    });

    it('should return empty stats when no clicks', async () => {
      prisma.contactClick.groupBy.mockResolvedValue([]);

      const result = await service.getClickStats(profileId, 7);

      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.total).toBe(0);
      expect(data.byType).toEqual({});
      expect(data.period).toBe('7d');
    });
  });

  describe('getDailyClickStats', () => {
    it('should group clicks by date and type', async () => {
      prisma.contactClick.findMany.mockResolvedValue([
        { type: 'whatsapp', createdAt: new Date('2026-03-15T10:00:00Z') },
        { type: 'whatsapp', createdAt: new Date('2026-03-15T14:00:00Z') },
        { type: 'phone', createdAt: new Date('2026-03-15T16:00:00Z') },
        { type: 'whatsapp', createdAt: new Date('2026-03-16T09:00:00Z') },
      ]);

      const result = await service.getDailyClickStats(profileId, 7);

      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.daily).toHaveLength(2);
      expect(data.daily[0].date).toBe('2026-03-15');
      expect(data.daily[0].total).toBe(3);
      expect(data.daily[0].byType.whatsapp).toBe(2);
      expect(data.daily[0].byType.phone).toBe(1);
      expect(data.daily[1].date).toBe('2026-03-16');
      expect(data.daily[1].total).toBe(1);
    });
  });

  describe('getAdminContactAnalytics', () => {
    it('should return aggregate analytics across all providers', async () => {
      prisma.contactClick.findMany.mockResolvedValue([
        { type: 'whatsapp', createdAt: new Date('2026-03-15T10:00:00Z') },
        { type: 'email', createdAt: new Date('2026-03-15T11:00:00Z') },
        { type: 'whatsapp', createdAt: new Date('2026-03-16T09:00:00Z') },
      ]);

      const result = await service.getAdminContactAnalytics(30);

      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.total).toBe(3);
      expect(data.byType.whatsapp).toBe(2);
      expect(data.byType.email).toBe(1);
      expect(data.daily).toHaveLength(2);
    });
  });
});
