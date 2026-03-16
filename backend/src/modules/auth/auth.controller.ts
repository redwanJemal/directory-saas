import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from './jwt.strategy';
import {
  LoginSchema,
  LoginDto,
  TenantLoginSchema,
  TenantLoginDto,
  RegisterSchema,
  RegisterDto,
  RefreshTokenSchema,
  RefreshTokenDto,
} from './dto';

@ApiTags('Auth')
@Controller('auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  async adminLogin(
    @Body(new ZodValidationPipe(LoginSchema)) dto: LoginDto,
    @Req() req: Request,
  ) {
    const result = await this.authService.adminLogin(
      dto,
      req.ip,
      req.headers['user-agent'],
    );
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Public()
  @Post('tenant/login')
  @HttpCode(HttpStatus.OK)
  async tenantLogin(
    @Body(new ZodValidationPipe(TenantLoginSchema)) dto: TenantLoginDto,
    @Req() req: Request,
  ) {
    const result = await this.authService.tenantLogin(
      dto,
      req.ip,
      req.headers['user-agent'],
    );
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Public()
  @Post('client/login')
  @HttpCode(HttpStatus.OK)
  async clientLogin(
    @Body(new ZodValidationPipe(LoginSchema)) dto: LoginDto,
    @Req() req: Request,
  ) {
    const result = await this.authService.clientLogin(
      dto,
      req.ip,
      req.headers['user-agent'],
    );
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Public()
  @Post('client/register')
  @HttpCode(HttpStatus.CREATED)
  async clientRegister(
    @Body(new ZodValidationPipe(RegisterSchema)) dto: RegisterDto,
    @Req() req: Request,
  ) {
    const result = await this.authService.clientRegister(
      dto,
      req.ip,
      req.headers['user-agent'],
    );
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body(new ZodValidationPipe(RefreshTokenSchema)) dto: RefreshTokenDto,
    @Req() req: Request,
  ) {
    const result = await this.authService.refresh(
      dto,
      req.ip,
      req.headers['user-agent'],
    );
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Body(new ZodValidationPipe(RefreshTokenSchema)) dto: RefreshTokenDto,
  ) {
    const result = await this.authService.logout(dto.refreshToken);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Get('me')
  async me(@CurrentUser() user: JwtPayload) {
    const result = await this.authService.getMe(user.sub, user.userType);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }
}
