import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AppConfigService } from '../../config/app-config.service';
import { ServiceResult } from '../../common/types';
import { ErrorCodes } from '../../common/constants/error-codes';
import { LoginDto, TenantLoginDto, RegisterDto, RefreshTokenDto, ChangePasswordDto } from './dto';
import { JwtPayload } from './jwt.strategy';

const BCRYPT_ROUNDS = 12;
const MAX_REFRESH_TOKENS_PER_USER = 5;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AdminLoginResult extends AuthTokens {
  user: { id: string; email: string; role: string };
}

export interface TenantLoginResult extends AuthTokens {
  user: { id: string; email: string; role: string; tenantId: string };
}

export interface ClientLoginResult extends AuthTokens {
  user: { id: string; email: string };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: AppConfigService,
  ) {}

  async adminLogin(
    dto: LoginDto,
    ipAddress?: string,
    deviceInfo?: string,
  ): Promise<ServiceResult<AdminLoginResult>> {
    const user = await this.prisma.adminUser.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      return ServiceResult.fail(ErrorCodes.INVALID_CREDENTIALS, 'Invalid email or password');
    }

    if (!user.isActive) {
      return ServiceResult.fail(ErrorCodes.ACCOUNT_DISABLED, 'Account is disabled');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      return ServiceResult.fail(ErrorCodes.INVALID_CREDENTIALS, 'Invalid email or password');
    }

    const payload: JwtPayload = {
      sub: user.id,
      userType: 'admin',
      email: user.email,
    };

    const tokens = await this.generateTokens(payload, user.id, 'admin', ipAddress, deviceInfo);

    await this.prisma.adminUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return ServiceResult.ok({
      ...tokens,
      user: { id: user.id, email: user.email, role: user.role },
    });
  }

  async tenantLogin(
    dto: TenantLoginDto,
    ipAddress?: string,
    deviceInfo?: string,
  ): Promise<ServiceResult<TenantLoginResult>> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: dto.tenantSlug },
    });

    if (!tenant) {
      return ServiceResult.fail(ErrorCodes.TENANT_NOT_FOUND, `Tenant '${dto.tenantSlug}' not found`);
    }

    if (tenant.status === 'SUSPENDED') {
      return ServiceResult.fail(ErrorCodes.TENANT_SUSPENDED, 'Tenant account is suspended');
    }

    const user = await this.prisma.tenantUser.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email: dto.email } },
    });

    if (!user) {
      return ServiceResult.fail(ErrorCodes.INVALID_CREDENTIALS, 'Invalid email or password');
    }

    if (!user.isActive) {
      return ServiceResult.fail(ErrorCodes.ACCOUNT_DISABLED, 'Account is disabled');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      return ServiceResult.fail(ErrorCodes.INVALID_CREDENTIALS, 'Invalid email or password');
    }

    const payload: JwtPayload = {
      sub: user.id,
      userType: 'tenant',
      tenantId: tenant.id,
      email: user.email,
    };

    const tokens = await this.generateTokens(payload, user.id, 'tenant', ipAddress, deviceInfo);

    await this.prisma.tenantUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return ServiceResult.ok({
      ...tokens,
      user: { id: user.id, email: user.email, role: user.role, tenantId: tenant.id, tenantSlug: tenant.slug },
    });
  }

  async clientLogin(
    dto: LoginDto,
    ipAddress?: string,
    deviceInfo?: string,
  ): Promise<ServiceResult<ClientLoginResult>> {
    const user = await this.prisma.clientUser.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      return ServiceResult.fail(ErrorCodes.INVALID_CREDENTIALS, 'Invalid email or password');
    }

    if (!user.isActive) {
      return ServiceResult.fail(ErrorCodes.ACCOUNT_DISABLED, 'Account is disabled');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      return ServiceResult.fail(ErrorCodes.INVALID_CREDENTIALS, 'Invalid email or password');
    }

    const payload: JwtPayload = {
      sub: user.id,
      userType: 'client',
      email: user.email,
    };

    const tokens = await this.generateTokens(payload, user.id, 'client', ipAddress, deviceInfo);

    await this.prisma.clientUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return ServiceResult.ok({
      ...tokens,
      user: { id: user.id, email: user.email },
    });
  }

  async clientRegister(
    dto: RegisterDto,
    ipAddress?: string,
    deviceInfo?: string,
  ): Promise<ServiceResult<ClientLoginResult>> {
    const existing = await this.prisma.clientUser.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      return ServiceResult.fail(ErrorCodes.ALREADY_EXISTS, 'Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.prisma.clientUser.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
      },
    });

    const payload: JwtPayload = {
      sub: user.id,
      userType: 'client',
      email: user.email,
    };

    const tokens = await this.generateTokens(payload, user.id, 'client', ipAddress, deviceInfo);

    return ServiceResult.ok({
      ...tokens,
      user: { id: user.id, email: user.email },
    });
  }

  async refresh(
    dto: RefreshTokenDto,
    ipAddress?: string,
    deviceInfo?: string,
  ): Promise<ServiceResult<AuthTokens>> {
    const tokenHash = this.hashToken(dto.refreshToken);

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!storedToken) {
      return ServiceResult.fail(ErrorCodes.UNAUTHORIZED, 'Invalid refresh token');
    }

    if (storedToken.expiresAt < new Date()) {
      await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });
      return ServiceResult.fail(ErrorCodes.TOKEN_EXPIRED, 'Refresh token has expired');
    }

    // Delete the used token (single-use rotation)
    await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });

    // Look up the user to build a fresh payload
    const payload = await this.buildPayloadForUser(storedToken.userId, storedToken.userType);
    if (!payload) {
      return ServiceResult.fail(ErrorCodes.UNAUTHORIZED, 'User no longer exists');
    }

    const tokens = await this.generateTokens(
      payload,
      storedToken.userId,
      storedToken.userType,
      ipAddress,
      deviceInfo,
    );

    return ServiceResult.ok(tokens);
  }

  async logout(refreshToken: string): Promise<ServiceResult<{ success: true }>> {
    const tokenHash = this.hashToken(refreshToken);

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (storedToken) {
      await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });
    }

    return ServiceResult.ok({ success: true });
  }

  async getMe(userId: string, userType: string): Promise<ServiceResult<Record<string, unknown>>> {
    if (userType === 'admin') {
      const user = await this.prisma.adminUser.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
      });
      if (!user) return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'User not found');
      return ServiceResult.ok({ ...user, userType: 'admin' });
    }

    if (userType === 'tenant') {
      const user = await this.prisma.tenantUser.findUnique({
        where: { id: userId },
        select: {
          id: true,
          tenantId: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          phone: true,
          avatarUrl: true,
          lastLoginAt: true,
          createdAt: true,
          roleAssignments: {
            select: {
              role: {
                select: {
                  name: true,
                  permissions: {
                    select: {
                      permission: {
                        select: { resource: true, action: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });
      if (!user) return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'User not found');

      const permissions = user.roleAssignments.flatMap((ra) =>
        ra.role.permissions.map((rp) => `${rp.permission.resource}:${rp.permission.action}`),
      );

      const { roleAssignments, ...userData } = user;
      return ServiceResult.ok({ ...userData, userType: 'tenant', permissions });
    }

    if (userType === 'client') {
      const user = await this.prisma.clientUser.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatarUrl: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
      });
      if (!user) return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'User not found');
      return ServiceResult.ok({ ...user, userType: 'client' });
    }

    return ServiceResult.fail(ErrorCodes.UNAUTHORIZED, 'Invalid user type');
  }

  async changePassword(
    userId: string,
    userType: string,
    dto: ChangePasswordDto,
  ): Promise<ServiceResult<{ success: true }>> {
    let user: { id: string; passwordHash: string } | null = null;

    if (userType === 'admin') {
      user = await this.prisma.adminUser.findUnique({
        where: { id: userId },
        select: { id: true, passwordHash: true },
      });
    } else if (userType === 'tenant') {
      user = await this.prisma.tenantUser.findUnique({
        where: { id: userId },
        select: { id: true, passwordHash: true },
      });
    } else if (userType === 'client') {
      user = await this.prisma.clientUser.findUnique({
        where: { id: userId },
        select: { id: true, passwordHash: true },
      });
    }

    if (!user) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'User not found');
    }

    const passwordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!passwordValid) {
      return ServiceResult.fail(ErrorCodes.INVALID_CREDENTIALS, 'Current password is incorrect');
    }

    const newHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);

    if (userType === 'admin') {
      await this.prisma.adminUser.update({
        where: { id: userId },
        data: { passwordHash: newHash },
      });
    } else if (userType === 'tenant') {
      await this.prisma.tenantUser.update({
        where: { id: userId },
        data: { passwordHash: newHash },
      });
    } else if (userType === 'client') {
      await this.prisma.clientUser.update({
        where: { id: userId },
        data: { passwordHash: newHash },
      });
    }

    return ServiceResult.ok({ success: true });
  }

  async deleteAccount(
    userId: string,
    userType: string,
  ): Promise<ServiceResult<{ success: true }>> {
    const now = new Date();

    if (userType === 'admin') {
      await this.prisma.adminUser.update({
        where: { id: userId },
        data: { deletedAt: now, isActive: false },
      });
    } else if (userType === 'tenant') {
      await this.prisma.tenantUser.update({
        where: { id: userId },
        data: { deletedAt: now, isActive: false },
      });
    } else if (userType === 'client') {
      await this.prisma.clientUser.update({
        where: { id: userId },
        data: { deletedAt: now, isActive: false },
      });
    } else {
      return ServiceResult.fail(ErrorCodes.UNAUTHORIZED, 'Invalid user type');
    }

    // Delete all refresh tokens for this user
    await this.prisma.refreshToken.deleteMany({
      where: { userId, userType },
    });

    return ServiceResult.ok({ success: true });
  }

  private async generateTokens(
    payload: JwtPayload,
    userId: string,
    userType: string,
    ipAddress?: string,
    deviceInfo?: string,
  ): Promise<AuthTokens> {
    const accessToken = this.jwtService.sign(payload);

    const rawRefreshToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);

    const refreshExpirationMs = this.parseExpiration(this.config.jwt.refreshExpiration);

    // Enforce max refresh tokens per user
    await this.enforceMaxTokens(userId, userType);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        userType,
        userId,
        ipAddress,
        deviceInfo,
        expiresAt: new Date(Date.now() + refreshExpirationMs),
      },
    });

    return { accessToken, refreshToken: rawRefreshToken };
  }

  private async enforceMaxTokens(userId: string, userType: string): Promise<void> {
    const tokens = await this.prisma.refreshToken.findMany({
      where: { userId, userType },
      orderBy: { createdAt: 'asc' },
    });

    if (tokens.length >= MAX_REFRESH_TOKENS_PER_USER) {
      const tokensToDelete = tokens.slice(0, tokens.length - MAX_REFRESH_TOKENS_PER_USER + 1);
      await this.prisma.refreshToken.deleteMany({
        where: { id: { in: tokensToDelete.map((t) => t.id) } },
      });
    }
  }

  private async buildPayloadForUser(
    userId: string,
    userType: string,
  ): Promise<JwtPayload | null> {
    if (userType === 'admin') {
      const user = await this.prisma.adminUser.findUnique({ where: { id: userId } });
      if (!user) return null;
      return { sub: user.id, userType: 'admin', email: user.email };
    }

    if (userType === 'tenant') {
      const user = await this.prisma.tenantUser.findUnique({ where: { id: userId } });
      if (!user) return null;
      return { sub: user.id, userType: 'tenant', tenantId: user.tenantId, email: user.email };
    }

    if (userType === 'client') {
      const user = await this.prisma.clientUser.findUnique({ where: { id: userId } });
      if (!user) return null;
      return { sub: user.id, userType: 'client', email: user.email };
    }

    return null;
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private parseExpiration(expiration: string): number {
    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7d

    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return value * (multipliers[unit] ?? 24 * 60 * 60 * 1000);
  }
}
