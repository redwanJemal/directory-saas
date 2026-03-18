import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../../prisma/prisma.service';
import { AppConfigService } from '../../config/app-config.service';
import { TenantCacheService } from '../../common/services/tenant-cache.service';
import { ServiceResult } from '../../common/types';
import { ErrorCodes } from '../../common/constants/error-codes';
import type { CreateCheckoutDto } from './dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly stripe: Stripe | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly cache: TenantCacheService,
  ) {
    const secretKey = this.config.stripe.secretKey;
    this.stripe = secretKey
      ? new Stripe(secretKey)
      : null;
  }

  private ensureStripe(): ServiceResult<Stripe> {
    if (!this.stripe) {
      return ServiceResult.fail(
        ErrorCodes.SERVICE_UNAVAILABLE,
        'Stripe is not configured. Set STRIPE_SECRET_KEY.',
      );
    }
    return ServiceResult.ok(this.stripe);
  }

  // === Checkout Session ===

  async createCheckoutSession(
    tenantId: string,
    dto: CreateCheckoutDto,
  ): Promise<ServiceResult<{ sessionId: string; url: string }>> {
    const stripeResult = this.ensureStripe();
    if (!stripeResult.success) return stripeResult as ServiceResult<any>;
    const stripe = stripeResult.data!;

    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: dto.planId },
    });
    if (!plan) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Plan not found');
    }
    if (!plan.isActive) {
      return ServiceResult.fail(ErrorCodes.CONFLICT, 'Plan is not active');
    }

    const priceId =
      dto.interval === 'yearly'
        ? plan.stripePriceIdYearly
        : plan.stripePriceIdMonthly;

    if (!priceId) {
      return ServiceResult.fail(
        ErrorCodes.CHECKOUT_ERROR,
        `No Stripe price configured for ${dto.interval} billing on plan '${plan.name}'`,
      );
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Tenant not found');
    }

    // Get or create Stripe customer
    const subscription = await this.prisma.tenantSubscription.findUnique({
      where: { tenantId },
    });

    let customerId = subscription?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        name: tenant.name,
        metadata: { tenantId },
      });
      customerId = customer.id;

      // Store customer ID
      if (subscription) {
        await this.prisma.tenantSubscription.update({
          where: { tenantId },
          data: { stripeCustomerId: customerId },
        });
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: dto.successUrl,
      cancel_url: dto.cancelUrl,
      metadata: {
        tenantId,
        planId: dto.planId,
        interval: dto.interval,
      },
      subscription_data: {
        metadata: {
          tenantId,
          planId: dto.planId,
        },
      },
    });

    return ServiceResult.ok({
      sessionId: session.id,
      url: session.url!,
    });
  }

  // === Customer Portal ===

  async createBillingPortalSession(
    tenantId: string,
    returnUrl: string,
  ): Promise<ServiceResult<{ url: string }>> {
    const stripeResult = this.ensureStripe();
    if (!stripeResult.success) return stripeResult as ServiceResult<any>;
    const stripe = stripeResult.data!;

    const subscription = await this.prisma.tenantSubscription.findUnique({
      where: { tenantId },
    });

    if (!subscription?.stripeCustomerId) {
      return ServiceResult.fail(
        ErrorCodes.NOT_FOUND,
        'No Stripe customer found for this tenant',
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: returnUrl,
    });

    return ServiceResult.ok({ url: session.url });
  }

  // === Webhook Processing ===

  async handleWebhook(
    payload: Buffer,
    signature: string,
  ): Promise<ServiceResult<{ received: boolean }>> {
    const stripeResult = this.ensureStripe();
    if (!stripeResult.success) return stripeResult as ServiceResult<any>;
    const stripe = stripeResult.data!;
    const webhookSecret = this.config.stripe.webhookSecret;

    if (!webhookSecret) {
      return ServiceResult.fail(
        ErrorCodes.INTERNAL_ERROR,
        'Stripe webhook secret not configured',
      );
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err}`);
      return ServiceResult.fail(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid webhook signature',
      );
    }

    this.logger.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;
      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(
          event.data.object as Stripe.Invoice,
        );
        break;
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }

    return ServiceResult.ok({ received: true });
  }

  private async handleCheckoutCompleted(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    const tenantId = session.metadata?.tenantId;
    const planId = session.metadata?.planId;
    const interval = session.metadata?.interval;

    if (!tenantId || !planId) {
      this.logger.warn('Checkout session missing tenantId or planId metadata');
      return;
    }

    const stripeSubscriptionId =
      typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id;

    const customerId =
      typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id;

    await this.prisma.tenantSubscription.upsert({
      where: { tenantId },
      update: {
        planId,
        status: 'ACTIVE',
        stripeSubscriptionId: stripeSubscriptionId ?? undefined,
        stripeCustomerId: customerId ?? undefined,
        billingInterval: interval ?? 'monthly',
        startedAt: new Date(),
      },
      create: {
        tenantId,
        planId,
        status: 'ACTIVE',
        stripeSubscriptionId: stripeSubscriptionId ?? undefined,
        stripeCustomerId: customerId ?? undefined,
        billingInterval: interval ?? 'monthly',
        startedAt: new Date(),
      },
    });

    await this.invalidateTenantCaches(tenantId);
    this.logger.log(`Checkout completed for tenant ${tenantId}, plan ${planId}`);
  }

  private async handleSubscriptionUpdated(
    stripeSubscription: Stripe.Subscription,
  ): Promise<void> {
    const tenantId = stripeSubscription.metadata?.tenantId;
    if (!tenantId) {
      this.logger.warn('Subscription update missing tenantId metadata');
      return;
    }

    const status = this.mapStripeStatus(stripeSubscription.status);

    // In newer Stripe API versions, current_period_end may be on the raw object
    const raw = stripeSubscription as unknown as Record<string, unknown>;
    const periodEnd = raw['current_period_end'] as number | undefined;
    const renewsAt = periodEnd ? new Date(periodEnd * 1000) : null;

    await this.prisma.tenantSubscription.updateMany({
      where: { tenantId },
      data: {
        status,
        stripeSubscriptionId: stripeSubscription.id,
        renewsAt,
      },
    });

    await this.invalidateTenantCaches(tenantId);
    this.logger.log(`Subscription updated for tenant ${tenantId}: ${status}`);
  }

  private async handleSubscriptionDeleted(
    stripeSubscription: Stripe.Subscription,
  ): Promise<void> {
    const tenantId = stripeSubscription.metadata?.tenantId;
    if (!tenantId) {
      this.logger.warn('Subscription deletion missing tenantId metadata');
      return;
    }

    await this.prisma.tenantSubscription.updateMany({
      where: { tenantId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    await this.invalidateTenantCaches(tenantId);
    this.logger.log(`Subscription cancelled for tenant ${tenantId}`);
  }

  private extractPaymentIntentId(invoice: Stripe.Invoice): string | null {
    // In newer Stripe API versions, payment_intent may not be directly on Invoice.
    // Access it safely via the raw object.
    const raw = invoice as unknown as Record<string, unknown>;
    const pi = raw['payment_intent'];
    if (typeof pi === 'string') return pi;
    if (pi && typeof pi === 'object' && 'id' in pi) return (pi as { id: string }).id;
    return null;
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    const customerId =
      typeof invoice.customer === 'string'
        ? invoice.customer
        : invoice.customer?.id;

    if (!customerId) return;

    const subscription = await this.prisma.tenantSubscription.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!subscription) {
      this.logger.warn(
        `No subscription found for Stripe customer ${customerId}`,
      );
      return;
    }

    await this.prisma.payment.create({
      data: {
        tenantSubscriptionId: subscription.id,
        stripePaymentIntentId: this.extractPaymentIntentId(invoice),
        stripeInvoiceId: invoice.id,
        amount: (invoice.amount_paid ?? 0) / 100,
        currency: (invoice.currency ?? 'usd').toUpperCase(),
        status: 'succeeded',
        description: `Invoice ${invoice.number ?? invoice.id}`,
        paidAt: new Date(),
      },
    });

    this.logger.log(
      `Payment recorded for subscription ${subscription.id}: ${(invoice.amount_paid ?? 0) / 100} ${invoice.currency}`,
    );
  }

  private async handleInvoicePaymentFailed(
    invoice: Stripe.Invoice,
  ): Promise<void> {
    const customerId =
      typeof invoice.customer === 'string'
        ? invoice.customer
        : invoice.customer?.id;

    if (!customerId) return;

    const subscription = await this.prisma.tenantSubscription.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!subscription) return;

    // Mark subscription as past due
    await this.prisma.tenantSubscription.update({
      where: { id: subscription.id },
      data: { status: 'PAST_DUE' },
    });

    await this.prisma.payment.create({
      data: {
        tenantSubscriptionId: subscription.id,
        stripePaymentIntentId: this.extractPaymentIntentId(invoice),
        stripeInvoiceId: invoice.id,
        amount: (invoice.amount_due ?? 0) / 100,
        currency: (invoice.currency ?? 'usd').toUpperCase(),
        status: 'failed',
        description: `Failed invoice ${invoice.number ?? invoice.id}`,
      },
    });

    await this.invalidateTenantCaches(subscription.tenantId);
    this.logger.log(
      `Payment failed for subscription ${subscription.id}`,
    );
  }

  // === Payment History ===

  async getPaymentHistory(
    tenantId: string,
    page: number,
    pageSize: number,
  ): Promise<ServiceResult<unknown>> {
    const subscription = await this.prisma.tenantSubscription.findUnique({
      where: { tenantId },
    });

    if (!subscription) {
      return ServiceResult.fail(
        ErrorCodes.NOT_FOUND,
        'No subscription found for this tenant',
      );
    }

    const [payments, totalCount] = await Promise.all([
      this.prisma.payment.findMany({
        where: { tenantSubscriptionId: subscription.id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.payment.count({
        where: { tenantSubscriptionId: subscription.id },
      }),
    ]);

    return ServiceResult.ok({
      data: payments.map((p) => ({
        id: p.id,
        amount: p.amount.toNumber(),
        currency: p.currency,
        status: p.status,
        description: p.description,
        paidAt: p.paidAt?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
      })),
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  }

  // === Admin Revenue Stats ===

  async getRevenueStats(): Promise<ServiceResult<unknown>> {
    const [totalRevenue, monthlyRevenue, activeSubscriptions, subscriptionsByPlan] =
      await Promise.all([
        this.prisma.payment.aggregate({
          _sum: { amount: true },
          where: { status: 'succeeded' },
        }),
        this.prisma.payment.aggregate({
          _sum: { amount: true },
          where: {
            status: 'succeeded',
            paidAt: {
              gte: new Date(
                new Date().getFullYear(),
                new Date().getMonth(),
                1,
              ),
            },
          },
        }),
        this.prisma.tenantSubscription.count({
          where: { status: 'ACTIVE' },
        }),
        this.prisma.tenantSubscription.groupBy({
          by: ['planId'],
          _count: { id: true },
          where: { status: 'ACTIVE' },
        }),
      ]);

    // Get plan names for the grouped data
    const planIds = subscriptionsByPlan.map((g) => g.planId);
    const plans = planIds.length
      ? await this.prisma.subscriptionPlan.findMany({
          where: { id: { in: planIds } },
          select: { id: true, displayName: true },
        })
      : [];
    const planMap = new Map(plans.map((p) => [p.id, p.displayName]));

    const byPlan = subscriptionsByPlan.map((g) => ({
      planId: g.planId,
      planName: planMap.get(g.planId) ?? 'Unknown',
      count: g._count.id,
    }));

    // Recent payments
    const recentPayments = await this.prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        subscription: {
          include: {
            tenant: { select: { id: true, name: true } },
            plan: { select: { id: true, displayName: true } },
          },
        },
      },
    });

    return ServiceResult.ok({
      totalRevenue: totalRevenue._sum.amount?.toNumber() ?? 0,
      monthlyRevenue: monthlyRevenue._sum.amount?.toNumber() ?? 0,
      activeSubscriptions,
      subscriptionsByPlan: byPlan,
      recentPayments: recentPayments.map((p) => ({
        id: p.id,
        amount: p.amount.toNumber(),
        currency: p.currency,
        status: p.status,
        description: p.description,
        paidAt: p.paidAt?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
        tenant: p.subscription.tenant,
        plan: p.subscription.plan,
      })),
    });
  }

  // === Helpers ===

  private mapStripeStatus(
    stripeStatus: Stripe.Subscription.Status,
  ): 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'TRIAL' {
    switch (stripeStatus) {
      case 'active':
        return 'ACTIVE';
      case 'past_due':
        return 'PAST_DUE';
      case 'canceled':
      case 'unpaid':
      case 'incomplete_expired':
        return 'CANCELLED';
      case 'trialing':
        return 'TRIAL';
      default:
        return 'ACTIVE';
    }
  }

  private async invalidateTenantCaches(tenantId: string): Promise<void> {
    await this.cache.invalidateByPattern(`saas:${tenantId}:plan-limits`);
    await this.cache.invalidateByPattern(`saas:${tenantId}:features`);
    await this.cache.invalidateByPattern(`saas:${tenantId}:usage:`);
  }
}
