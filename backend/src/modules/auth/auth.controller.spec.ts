import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ServiceResult } from '../../common/types';
import { AppException } from '../../common/exceptions/app.exception';

const mockRequest = {
  ip: '127.0.0.1',
  headers: { 'user-agent': 'test-agent' },
} as any;

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            adminLogin: jest.fn(),
            tenantLogin: jest.fn(),
            clientLogin: jest.fn(),
            clientRegister: jest.fn(),
            refresh: jest.fn(),
            logout: jest.fn(),
            getMe: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  describe('adminLogin', () => {
    it('should return tokens on success', async () => {
      const data = {
        accessToken: 'at',
        refreshToken: 'rt',
        user: { id: '1', email: 'a@b.com', role: 'SUPER_ADMIN' },
      };
      authService.adminLogin.mockResolvedValue(ServiceResult.ok(data));

      const result = await controller.adminLogin(
        { email: 'a@b.com', password: 'password123' },
        mockRequest,
      );

      expect(result).toEqual(data);
    });

    it('should throw on failure', async () => {
      authService.adminLogin.mockResolvedValue(
        ServiceResult.fail('INVALID_CREDENTIALS', 'Invalid email or password'),
      );

      await expect(
        controller.adminLogin({ email: 'a@b.com', password: 'wrong' }, mockRequest),
      ).rejects.toThrow(AppException);
    });
  });

  describe('tenantLogin', () => {
    it('should return tokens on success', async () => {
      const data = {
        accessToken: 'at',
        refreshToken: 'rt',
        user: { id: '1', email: 'a@b.com', role: 'OWNER', tenantId: 't1' },
      };
      authService.tenantLogin.mockResolvedValue(ServiceResult.ok(data));

      const result = await controller.tenantLogin(
        { email: 'a@b.com', password: 'password123', tenantSlug: 'test' },
        mockRequest,
      );

      expect(result).toEqual(data);
    });
  });

  describe('clientRegister', () => {
    it('should return 201 with tokens on success', async () => {
      const data = {
        accessToken: 'at',
        refreshToken: 'rt',
        user: { id: '1', email: 'new@test.com' },
      };
      authService.clientRegister.mockResolvedValue(ServiceResult.ok(data));

      const result = await controller.clientRegister(
        { email: 'new@test.com', password: 'password123', firstName: 'N', lastName: 'U' },
        mockRequest,
      );

      expect(result).toEqual(data);
    });
  });

  describe('refresh', () => {
    it('should return new tokens', async () => {
      const data = { accessToken: 'new-at', refreshToken: 'new-rt' };
      authService.refresh.mockResolvedValue(ServiceResult.ok(data));

      const result = await controller.refresh({ refreshToken: 'old-rt' }, mockRequest);

      expect(result).toEqual(data);
    });
  });

  describe('logout', () => {
    it('should return success', async () => {
      authService.logout.mockResolvedValue(ServiceResult.ok({ success: true as const }));

      const result = await controller.logout({ refreshToken: 'rt' });

      expect(result).toEqual({ success: true });
    });
  });

  describe('me', () => {
    it('should return user profile', async () => {
      const data = { id: '1', email: 'a@b.com', userType: 'admin' };
      authService.getMe.mockResolvedValue(ServiceResult.ok(data));

      const result = await controller.me({ sub: '1', userType: 'admin', email: 'a@b.com' });

      expect(result).toEqual(data);
    });
  });
});
