import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AppConfigService } from '../../config/app-config.service';

jest.mock('bcrypt', () => ({
  ...jest.requireActual('bcrypt'),
  compare: jest.fn(),
  hash: jest.fn(),
}));

jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomBytes: jest.fn().mockReturnValue(Buffer.from('a'.repeat(32))),
}));

// Factory helpers
const makeAdminUser = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'admin-uuid-1',
  email: 'admin@test.com',
  passwordHash: '$2b$12$hashedpassword',
  firstName: 'Admin',
  lastName: 'User',
  role: 'SUPER_ADMIN',
  isActive: true,
  lastLoginAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  twoFactorSecret: null,
  twoFactorEnabled: false,
  ...overrides,
});

const makeTenant = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'tenant-uuid-1',
  name: 'Test Tenant',
  slug: 'test-tenant',
  domain: null,
  status: 'ACTIVE',
  logoUrl: null,
  primaryColor: null,
  secondaryColor: null,
  settings: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...overrides,
});

const makeTenantUser = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'tenant-user-uuid-1',
  tenantId: 'tenant-uuid-1',
  email: 'user@tenant.com',
  passwordHash: '$2b$12$hashedpassword',
  firstName: 'Tenant',
  lastName: 'User',
  role: 'OWNER',
  isActive: true,
  emailVerified: false,
  avatarUrl: null,
  phone: null,
  lastLoginAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...overrides,
});

const makeClientUser = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'client-uuid-1',
  email: 'client@test.com',
  passwordHash: '$2b$12$hashedpassword',
  firstName: 'Client',
  lastName: 'User',
  phone: null,
  avatarUrl: null,
  isActive: true,
  emailVerified: false,
  lastLoginAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...overrides,
});

const makeRefreshToken = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'refresh-token-uuid-1',
  tokenHash: crypto.createHash('sha256').update('valid-refresh-token').digest('hex'),
  userType: 'admin',
  userId: 'admin-uuid-1',
  deviceInfo: null,
  ipAddress: null,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  createdAt: new Date(),
  ...overrides,
});

describe('AuthService', () => {
  let service: AuthService;
  let prisma: Record<string, any>;
  let jwtService: JwtService;

  beforeEach(async () => {
    prisma = {
      adminUser: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      tenant: {
        findUnique: jest.fn(),
      },
      tenantUser: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      clientUser: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      refreshToken: {
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-access-token'),
          },
        },
        {
          provide: AppConfigService,
          useValue: {
            jwt: {
              secret: 'test-secret-that-is-long-enough-32chars',
              expiration: '15m',
              refreshSecret: 'test-refresh-secret-that-is-long-enough',
              refreshExpiration: '7d',
            },
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('adminLogin', () => {
    it('should return tokens for valid credentials', async () => {
      const admin = makeAdminUser();
      prisma.adminUser.findUnique.mockResolvedValue(admin);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.adminLogin({ email: 'admin@test.com', password: 'password123' });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('accessToken');
      expect(result.data).toHaveProperty('refreshToken');
      expect(result.data?.user).toEqual({
        id: admin.id,
        email: admin.email,
        role: admin.role,
      });
    });

    it('should return INVALID_CREDENTIALS for wrong password', async () => {
      prisma.adminUser.findUnique.mockResolvedValue(makeAdminUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.adminLogin({ email: 'admin@test.com', password: 'wrongpass' });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return INVALID_CREDENTIALS for non-existent user', async () => {
      prisma.adminUser.findUnique.mockResolvedValue(null);

      const result = await service.adminLogin({ email: 'nope@test.com', password: 'password123' });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return ACCOUNT_DISABLED for inactive account', async () => {
      prisma.adminUser.findUnique.mockResolvedValue(makeAdminUser({ isActive: false }));

      const result = await service.adminLogin({ email: 'admin@test.com', password: 'password123' });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('ACCOUNT_DISABLED');
    });
  });

  describe('tenantLogin', () => {
    it('should resolve correct tenant and return tokens', async () => {
      const tenant = makeTenant();
      const user = makeTenantUser();
      prisma.tenant.findUnique.mockResolvedValue(tenant);
      prisma.tenantUser.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.tenantLogin({
        email: 'user@tenant.com',
        password: 'password123',
        tenantSlug: 'test-tenant',
      });

      expect(result.success).toBe(true);
      expect(result.data?.user.tenantId).toBe(tenant.id);
    });

    it('should return TENANT_NOT_FOUND for wrong tenant slug', async () => {
      prisma.tenant.findUnique.mockResolvedValue(null);

      const result = await service.tenantLogin({
        email: 'user@tenant.com',
        password: 'password123',
        tenantSlug: 'wrong-tenant',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TENANT_NOT_FOUND');
    });

    it('should return TENANT_SUSPENDED for suspended tenant', async () => {
      prisma.tenant.findUnique.mockResolvedValue(makeTenant({ status: 'SUSPENDED' }));

      const result = await service.tenantLogin({
        email: 'user@tenant.com',
        password: 'password123',
        tenantSlug: 'test-tenant',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TENANT_SUSPENDED');
    });
  });

  describe('clientLogin', () => {
    it('should return tokens for valid credentials', async () => {
      prisma.clientUser.findUnique.mockResolvedValue(makeClientUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.clientLogin({ email: 'client@test.com', password: 'password123' });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('accessToken');
      expect(result.data).toHaveProperty('refreshToken');
    });
  });

  describe('clientRegister', () => {
    it('should create user and return tokens', async () => {
      prisma.clientUser.findUnique.mockResolvedValue(null);
      const newUser = makeClientUser();
      prisma.clientUser.create.mockResolvedValue(newUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

      const result = await service.clientRegister({
        email: 'new@test.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('accessToken');
      expect(result.data).toHaveProperty('refreshToken');
      expect(prisma.clientUser.create).toHaveBeenCalled();
    });

    it('should return ALREADY_EXISTS for duplicate email', async () => {
      prisma.clientUser.findUnique.mockResolvedValue(makeClientUser());

      const result = await service.clientRegister({
        email: 'client@test.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('ALREADY_EXISTS');
    });
  });

  describe('refresh', () => {
    it('should rotate tokens (old invalidated, new created)', async () => {
      const stored = makeRefreshToken();
      prisma.refreshToken.findUnique.mockResolvedValue(stored);
      prisma.adminUser.findUnique.mockResolvedValue(makeAdminUser());

      const result = await service.refresh({ refreshToken: 'valid-refresh-token' });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('accessToken');
      expect(result.data).toHaveProperty('refreshToken');
      // Old token deleted
      expect(prisma.refreshToken.delete).toHaveBeenCalledWith({ where: { id: stored.id } });
      // New token created
      expect(prisma.refreshToken.create).toHaveBeenCalled();
    });

    it('should return TOKEN_EXPIRED for expired refresh token', async () => {
      const stored = makeRefreshToken({
        expiresAt: new Date(Date.now() - 1000),
      });
      prisma.refreshToken.findUnique.mockResolvedValue(stored);

      const result = await service.refresh({ refreshToken: 'valid-refresh-token' });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TOKEN_EXPIRED');
    });

    it('should return UNAUTHORIZED for invalid refresh token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);

      const result = await service.refresh({ refreshToken: 'invalid-token' });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNAUTHORIZED');
    });
  });

  describe('logout', () => {
    it('should delete refresh token', async () => {
      const stored = makeRefreshToken();
      prisma.refreshToken.findUnique.mockResolvedValue(stored);

      const result = await service.logout('valid-refresh-token');

      expect(result.success).toBe(true);
      expect(prisma.refreshToken.delete).toHaveBeenCalledWith({ where: { id: stored.id } });
    });
  });

  describe('getMe', () => {
    it('should return admin user profile', async () => {
      const admin = makeAdminUser();
      prisma.adminUser.findUnique.mockResolvedValue(admin);

      const result = await service.getMe('admin-uuid-1', 'admin');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('email', 'admin@test.com');
      expect(result.data).toHaveProperty('userType', 'admin');
    });

    it('should return tenant user profile with permissions', async () => {
      prisma.tenantUser.findUnique.mockResolvedValue({
        ...makeTenantUser(),
        roleAssignments: [
          {
            role: {
              name: 'admin',
              permissions: [
                { permission: { resource: 'users', action: 'read' } },
              ],
            },
          },
        ],
      });

      const result = await service.getMe('tenant-user-uuid-1', 'tenant');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('userType', 'tenant');
      expect(result.data).toHaveProperty('permissions');
      expect((result.data as any).permissions).toContain('users:read');
    });

    it('should return client user profile', async () => {
      prisma.clientUser.findUnique.mockResolvedValue(makeClientUser());

      const result = await service.getMe('client-uuid-1', 'client');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('userType', 'client');
    });

    it('should return NOT_FOUND when user does not exist', async () => {
      prisma.adminUser.findUnique.mockResolvedValue(null);

      const result = await service.getMe('missing-uuid', 'admin');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });
  });

  describe('enforceMaxTokens', () => {
    it('should delete oldest tokens when max exceeded', async () => {
      const admin = makeAdminUser();
      prisma.adminUser.findUnique.mockResolvedValue(admin);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Simulate 5 existing tokens
      const existingTokens = Array.from({ length: 5 }, (_, i) => ({
        id: `token-${i}`,
        createdAt: new Date(Date.now() - (5 - i) * 1000),
      }));
      prisma.refreshToken.findMany.mockResolvedValue(existingTokens);

      await service.adminLogin({ email: 'admin@test.com', password: 'password123' });

      // Should delete oldest token to make room
      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ['token-0'] } },
      });
    });
  });
});
