import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppConfigService } from '../../config/app-config.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TelegramService } from './telegram.service';

@Injectable()
export class TelegramChannelService {
  private readonly logger = new Logger(TelegramChannelService.name);
  private readonly channelId: string;

  constructor(
    private readonly config: AppConfigService,
    private readonly prisma: PrismaService,
    private readonly telegramService: TelegramService,
  ) {
    this.channelId = this.config.telegram.channelId;
  }

  // Listen for new verified businesses
  @OnEvent('entity.created', { async: true })
  async handleEntityCreated(event: {
    entity: string;
    entityId: string;
    tenantId?: string;
  }): Promise<void> {
    if (event.entity !== 'ProviderProfile' || !this.channelId) return;

    // Small delay to ensure data is committed
    await new Promise((r) => setTimeout(r, 2000));

    try {
      const profile = await this.prisma.providerProfile.findUnique({
        where: { id: event.entityId },
        include: {
          tenant: true,
          categories: { include: { category: true } },
        },
      });

      if (!profile || !profile.isVerified) return;

      await this.postNewBusiness(profile);
    } catch (error) {
      this.logger.error('Failed to post new business to channel', error);
    }
  }

  async postNewBusiness(profile: {
    tenant: { name: string; slug: string };
    bio?: string | null;
    country?: string | null;
    city?: string | null;
    whatsapp?: string | null;
    isVerified: boolean;
    categories: Array<{ category: { name: string } }>;
  }): Promise<void> {
    if (!this.channelId) return;

    const categories = profile.categories
      .map((pc) => pc.category.name)
      .join(', ');

    const verified = profile.isVerified ? ' ✅' : '';
    const lines = [
      `🆕 *New Business on Habesha Hub\\!*`,
      '',
      `*${this.escapeMarkdown(profile.tenant.name)}*${verified}`,
    ];

    if (profile.bio) lines.push(`_${this.escapeMarkdown(profile.bio)}_`);
    if (categories) lines.push(`📂 ${this.escapeMarkdown(categories)}`);
    if (profile.country && profile.city) {
      lines.push(`📍 ${this.escapeMarkdown(profile.city)}, ${this.escapeMarkdown(profile.country)}`);
    }

    const keyboard = [
      [{
        text: '📋 View Profile',
        url: `https://t.me/habeshahub_bot?start=business_${profile.tenant.slug}`,
      }],
      [{
        text: '📤 Share',
        url: `https://t.me/share/url?url=${encodeURIComponent(`https://t.me/habeshahub_bot?start=business_${profile.tenant.slug}`)}&text=${encodeURIComponent(profile.tenant.name)}`,
      }],
    ];

    await this.telegramService.sendMessage(this.channelId, lines.join('\n'), {
      inline_keyboard: keyboard,
    });
  }

  async postNewDeal(deal: {
    id: string;
    title: string;
    description?: string | null;
    discountPercent?: number | null;
    dealPrice?: unknown;
    providerProfile: {
      tenant: { name: string; slug: string };
      city?: string | null;
      country?: string | null;
    };
  }): Promise<void> {
    if (!this.channelId) return;

    const discount = deal.discountPercent
      ? `${deal.discountPercent}% off`
      : '';

    const lines = [
      `🏷️ *New Deal\\!*`,
      '',
      `*${this.escapeMarkdown(deal.title)}*`,
      `at *${this.escapeMarkdown(deal.providerProfile.tenant.name)}*`,
    ];

    if (discount) lines.push(`💰 ${this.escapeMarkdown(discount)}`);
    if (deal.description) {
      lines.push('', this.escapeMarkdown(deal.description.slice(0, 200)));
    }
    if (deal.providerProfile.city) {
      lines.push(`📍 ${this.escapeMarkdown(deal.providerProfile.city)}`);
    }

    const keyboard = [
      [{
        text: '🏷️ View Deal',
        web_app: { url: `${this.config.telegram.miniAppUrl}?startapp=deal_${deal.id}` },
      }],
      [{
        text: '📋 View Business',
        url: `https://t.me/habeshahub_bot?start=business_${deal.providerProfile.tenant.slug}`,
      }],
    ];

    await this.telegramService.sendMessage(this.channelId, lines.join('\n'), {
      inline_keyboard: keyboard,
    });
  }

  private escapeMarkdown(text: string): string {
    return text.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
  }
}
