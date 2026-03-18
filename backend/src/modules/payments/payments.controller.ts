import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  RawBodyRequest,
  Headers,
} from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CreateCheckoutSchema, CreateCheckoutDto } from './dto';

// === Provider Checkout & Billing ===

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('checkout')
  @HttpCode(HttpStatus.CREATED)
  async createCheckout(
    @CurrentTenant() tenantId: string,
    @Body(new ZodValidationPipe(CreateCheckoutSchema)) dto: CreateCheckoutDto,
  ) {
    const result = await this.paymentsService.createCheckoutSession(
      tenantId,
      dto,
    );
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Post('billing-portal')
  async createBillingPortal(
    @CurrentTenant() tenantId: string,
    @Body('returnUrl') returnUrl: string,
  ) {
    const result = await this.paymentsService.createBillingPortalSession(
      tenantId,
      returnUrl || '/',
    );
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Get('history')
  async getPaymentHistory(
    @CurrentTenant() tenantId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    const pageSizeNum = Math.min(
      100,
      Math.max(1, parseInt(pageSize || '20', 10) || 20),
    );
    const result = await this.paymentsService.getPaymentHistory(
      tenantId,
      pageNum,
      pageSizeNum,
    );
    if (!result.success) throw result.toHttpException();
    return result.data;
  }
}

// === Stripe Webhook (public, raw body) ===

@Controller('payments/webhook')
export class PaymentsWebhookController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @Public()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody) {
      return { received: false, error: 'Missing raw body' };
    }

    const result = await this.paymentsService.handleWebhook(rawBody, signature);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }
}

// === Admin Revenue ===

@Controller('admin/payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class AdminPaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('revenue')
  async getRevenueStats() {
    const result = await this.paymentsService.getRevenueStats();
    if (!result.success) throw result.toHttpException();
    return result.data;
  }
}
