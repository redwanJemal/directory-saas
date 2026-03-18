import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { AppConfigService } from '../../config/app-config.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ServiceResult } from '../../common/types';
import { TelegramMessage, TelegramUser } from './dto';

interface TelegramApiResponse {
  ok: boolean;
  result?: unknown;
  description?: string;
}

interface InlineKeyboardButton {
  text: string;
  url?: string;
  callback_data?: string;
  web_app?: { url: string };
}

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken: string;
  private readonly miniAppUrl: string;
  private readonly apiBase: string;

  constructor(
    private readonly config: AppConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.botToken = this.config.telegram.botToken;
    this.miniAppUrl = this.config.telegram.miniAppUrl;
    this.apiBase = `https://api.telegram.org/bot${this.botToken}`;
  }

  // === Init Data Verification ===

  verifyInitData(initData: string): ServiceResult<TelegramUser> {
    if (!this.botToken) {
      return ServiceResult.fail('INTERNAL_ERROR', 'Telegram bot token not configured');
    }

    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) {
      return ServiceResult.fail('UNAUTHORIZED', 'Missing hash in initData');
    }

    params.delete('hash');
    const entries = Array.from(params.entries());
    entries.sort(([a], [b]) => a.localeCompare(b));
    const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n');

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(this.botToken)
      .digest();

    const computedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (computedHash !== hash) {
      return ServiceResult.fail('UNAUTHORIZED', 'Invalid initData signature');
    }

    // Check auth_date freshness (allow 24 hours)
    const authDate = params.get('auth_date');
    if (authDate) {
      const authTimestamp = parseInt(authDate, 10);
      const now = Math.floor(Date.now() / 1000);
      if (now - authTimestamp > 86400) {
        return ServiceResult.fail('TOKEN_EXPIRED', 'initData has expired');
      }
    }

    const userParam = params.get('user');
    if (!userParam) {
      return ServiceResult.fail('UNAUTHORIZED', 'Missing user in initData');
    }

    const user = JSON.parse(userParam) as TelegramUser;
    return ServiceResult.ok(user);
  }

  // === Bot Commands ===

  async handleMessage(message: TelegramMessage): Promise<void> {
    const chatId = message.chat.id;

    // Handle location messages (no text)
    if (message.location) {
      await this.handleLocationMessage(chatId, message.location.latitude, message.location.longitude);
      return;
    }

    if (!message.text) return;

    const text = message.text.trim();

    if (text.startsWith('/start')) {
      const param = text.split(' ')[1];
      if (param?.startsWith('business_')) {
        const slug = param.replace('business_', '');
        await this.handleDeepLink(chatId, slug);
      } else {
        await this.sendWelcomeMessage(chatId);
      }
    } else if (text.startsWith('/search')) {
      const query = text.replace('/search', '').trim();
      await this.handleSearchCommand(chatId, query);
    } else if (text === '/categories') {
      await this.handleCategoriesCommand(chatId);
    } else if (text === '/deals') {
      await this.handleDealsCommand(chatId);
    } else if (text === '/near') {
      await this.handleNearCommand(chatId);
    }
  }

  private async sendWelcomeMessage(chatId: number): Promise<void> {
    const keyboard: InlineKeyboardButton[][] = [
      [{ text: '🔍 Open Habesha Hub', web_app: { url: this.miniAppUrl } }],
      [
        { text: '📂 Categories', callback_data: 'categories' },
        { text: '🏷️ Deals', callback_data: 'deals' },
      ],
    ];

    await this.sendMessage(chatId, [
      '🇪🇹 *Welcome to Habesha Hub!*',
      '',
      'Find Ethiopian businesses across the Middle East.',
      '',
      '*Commands:*',
      '/search \\<query\\> — Search businesses',
      '/categories — Browse categories',
      '/deals — View current deals',
      '/near — Find businesses near you',
      '',
      'Tap the button below to open the full directory:',
    ].join('\n'), { inline_keyboard: keyboard });
  }

  private async handleDeepLink(chatId: number, slug: string): Promise<void> {
    const profile = await this.prisma.providerProfile.findFirst({
      where: {
        tenant: { slug, deletedAt: null },
      },
      include: {
        tenant: true,
        categories: { include: { category: true } },
      },
    });

    if (!profile) {
      await this.sendMessage(chatId, '❌ Business not found.');
      return;
    }

    const categories = profile.categories
      .map((pc) => pc.category.name)
      .join(', ');

    const verified = profile.isVerified ? ' ✅' : '';
    const lines = [
      `*${this.escapeMarkdown(profile.tenant.name)}*${verified}`,
    ];

    if (profile.bio) lines.push(`_${this.escapeMarkdown(profile.bio)}_`);
    if (categories) lines.push(`📂 ${this.escapeMarkdown(categories)}`);
    if (profile.country && profile.city) {
      lines.push(`📍 ${this.escapeMarkdown(profile.city)}, ${this.escapeMarkdown(profile.country)}`);
    }
    if (profile.description) {
      lines.push('', this.escapeMarkdown(profile.description.slice(0, 300)));
    }

    const keyboard: InlineKeyboardButton[][] = [
      [{ text: '📋 View Full Profile', web_app: { url: `${this.miniAppUrl}?startapp=business_${slug}` } }],
    ];

    if (profile.whatsapp) {
      keyboard.push([{ text: '💬 WhatsApp', url: `https://wa.me/${profile.whatsapp.replace(/[^0-9]/g, '')}` }]);
    }
    if (profile.phone) {
      keyboard.push([{ text: '📞 Call', url: `tel:${profile.phone}` }]);
    }

    keyboard.push([{
      text: '📤 Share',
      url: `https://t.me/share/url?url=${encodeURIComponent(`https://t.me/habeshahub_bot?start=business_${slug}`)}&text=${encodeURIComponent(profile.tenant.name)}`,
    }]);

    await this.sendMessage(chatId, lines.join('\n'), { inline_keyboard: keyboard });
  }

  private async handleSearchCommand(chatId: number, query: string): Promise<void> {
    if (!query) {
      await this.sendMessage(chatId, '🔍 Usage: `/search restaurant dubai`');
      return;
    }

    const profiles = await this.prisma.providerProfile.findMany({
      where: {
        tenant: { deletedAt: null },
        OR: [
          { tenant: { name: { contains: query, mode: 'insensitive' } } },
          { bio: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: { tenant: true },
      take: 5,
      orderBy: [{ isVerified: 'desc' }, { tenant: { name: 'asc' } }],
    });

    if (profiles.length === 0) {
      const keyboard: InlineKeyboardButton[][] = [
        [{ text: '🔍 Search in App', web_app: { url: `${this.miniAppUrl}?startapp=search_${encodeURIComponent(query)}` } }],
      ];
      await this.sendMessage(chatId, `No results for "${this.escapeMarkdown(query)}"\\.`, { inline_keyboard: keyboard });
      return;
    }

    const lines = [`🔍 *Results for "${this.escapeMarkdown(query)}"*`, ''];
    const keyboard: InlineKeyboardButton[][] = [];

    for (const p of profiles) {
      const verified = p.isVerified ? ' ✅' : '';
      const location = p.city ? ` • ${p.city}` : '';
      lines.push(`• *${this.escapeMarkdown(p.tenant.name)}*${verified}${this.escapeMarkdown(location)}`);
      keyboard.push([{
        text: p.tenant.name,
        url: `https://t.me/habeshahub_bot?start=business_${p.tenant.slug}`,
      }]);
    }

    keyboard.push([{
      text: '🔍 See all results',
      web_app: { url: `${this.miniAppUrl}?startapp=search_${encodeURIComponent(query)}` },
    }]);

    await this.sendMessage(chatId, lines.join('\n'), { inline_keyboard: keyboard });
  }

  private async handleCategoriesCommand(chatId: number): Promise<void> {
    const categories = await this.prisma.category.findMany({
      where: { parentId: null },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { providers: true } },
      },
    });

    const lines = ['📂 *Business Categories*', ''];
    const keyboard: InlineKeyboardButton[][] = [];

    const icons: Record<string, string> = {
      'food-drink': '🍽️',
      'beauty-grooming': '💇',
      'services': '🔧',
      'automotive': '🚗',
      'health-wellness': '🏥',
      'shopping': '🛍️',
      'community': '🤝',
    };

    for (const cat of categories) {
      const icon = icons[cat.slug] || '📌';
      const count = cat._count.providers;
      lines.push(`${icon} *${this.escapeMarkdown(cat.name)}* \\(${count}\\)`);
      keyboard.push([{
        text: `${icon} ${cat.name} (${count})`,
        web_app: { url: `${this.miniAppUrl}?startapp=category_${cat.slug}` },
      }]);
    }

    await this.sendMessage(chatId, lines.join('\n'), { inline_keyboard: keyboard });
  }

  private async handleDealsCommand(chatId: number): Promise<void> {
    const deals = await this.prisma.deal.findMany({
      where: {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: {
        providerProfile: { include: { tenant: true } },
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    if (deals.length === 0) {
      await this.sendMessage(chatId, '🏷️ No active deals right now\\. Check back later\\!');
      return;
    }

    const lines = ['🏷️ *Latest Deals*', ''];
    const keyboard: InlineKeyboardButton[][] = [];

    for (const deal of deals) {
      const discount = deal.discountPercent
        ? `${deal.discountPercent}% off`
        : deal.dealPrice
          ? `$${deal.dealPrice}`
          : '';
      lines.push(`• *${this.escapeMarkdown(deal.title)}*`);
      if (discount) lines.push(`  ${this.escapeMarkdown(discount)} at ${this.escapeMarkdown(deal.providerProfile.tenant.name)}`);
      keyboard.push([{
        text: `🏷️ ${deal.title}`,
        web_app: { url: `${this.miniAppUrl}?startapp=deal_${deal.id}` },
      }]);
    }

    keyboard.push([{
      text: '📋 View All Deals',
      web_app: { url: `${this.miniAppUrl}?startapp=deals` },
    }]);

    await this.sendMessage(chatId, lines.join('\n'), { inline_keyboard: keyboard });
  }

  private async handleNearCommand(chatId: number): Promise<void> {
    const keyboard: InlineKeyboardButton[][] = [
      [{
        text: '📍 Share Location',
        callback_data: 'share_location',
      }],
    ];

    await this.sendMessage(
      chatId,
      '📍 Share your location to find Ethiopian businesses near you\\.\n\nTap the 📎 button and select *Location*\\.',
      { inline_keyboard: keyboard },
    );
  }

  private async handleLocationMessage(
    chatId: number,
    _latitude: number,
    _longitude: number,
  ): Promise<void> {
    // For now, open the mini app — full geo-search can be added later
    const keyboard: InlineKeyboardButton[][] = [
      [{ text: '🔍 Browse Nearby', web_app: { url: `${this.miniAppUrl}?startapp=nearby` } }],
    ];

    await this.sendMessage(
      chatId,
      '📍 Location received\\! Open the directory to browse businesses near you:',
      { inline_keyboard: keyboard },
    );
  }

  // === Telegram API Helpers ===

  async sendMessage(
    chatId: number | string,
    text: string,
    replyMarkup?: { inline_keyboard: InlineKeyboardButton[][] },
  ): Promise<ServiceResult<unknown>> {
    return this.callApi('sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'MarkdownV2',
      ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
    });
  }

  async sendPhoto(
    chatId: number | string,
    photoUrl: string,
    caption: string,
    replyMarkup?: { inline_keyboard: InlineKeyboardButton[][] },
  ): Promise<ServiceResult<unknown>> {
    return this.callApi('sendPhoto', {
      chat_id: chatId,
      photo: photoUrl,
      caption,
      parse_mode: 'MarkdownV2',
      ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
    });
  }

  private async callApi(
    method: string,
    body: Record<string, unknown>,
  ): Promise<ServiceResult<unknown>> {
    if (!this.botToken) {
      return ServiceResult.fail('INTERNAL_ERROR', 'Telegram bot token not configured');
    }

    try {
      const response = await fetch(`${this.apiBase}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = (await response.json()) as TelegramApiResponse;

      if (!data.ok) {
        this.logger.error(`Telegram API error: ${data.description}`, { method, chatId: body.chat_id });
        return ServiceResult.fail('INTERNAL_ERROR', `Telegram API: ${data.description}`);
      }

      return ServiceResult.ok(data.result);
    } catch (error) {
      this.logger.error(`Telegram API call failed: ${method}`, error);
      return ServiceResult.fail('INTERNAL_ERROR', 'Failed to call Telegram API');
    }
  }

  private escapeMarkdown(text: string): string {
    return text.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
  }
}
