import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ServiceResult } from '../../common/types';
import { ErrorCodes } from '../../common/constants/error-codes';
import { ContactClickType } from './dto';

const DEFAULT_WHATSAPP_MESSAGE =
  "Hi! I found your business on Habesha Hub. I'd like to inquire about your services.";

@Injectable()
export class ContactClickService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Format a WhatsApp number to international format.
   * Strips spaces, dashes, parentheses. Ensures + prefix with country code.
   */
  formatWhatsAppNumber(raw: string): string {
    // Strip all non-digit characters except leading +
    let cleaned = raw.replace(/[^+\d]/g, '');

    // If starts with 00, replace with +
    if (cleaned.startsWith('00')) {
      cleaned = '+' + cleaned.slice(2);
    }

    // If no + prefix, assume it's already in international format without +
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }

    return cleaned;
  }

  /**
   * Generate a WhatsApp click-to-chat URL.
   */
  generateWhatsAppUrl(
    whatsappNumber: string,
    customMessage?: string | null,
  ): string {
    const number = this.formatWhatsAppNumber(whatsappNumber);
    // Remove the + for wa.me URL format
    const numberWithoutPlus = number.replace('+', '');
    const message = customMessage || DEFAULT_WHATSAPP_MESSAGE;
    return `https://wa.me/${numberWithoutPlus}?text=${encodeURIComponent(message)}`;
  }

  /**
   * Generate the appropriate contact URL for a given type.
   */
  generateContactUrl(
    type: ContactClickType,
    profile: {
      whatsapp?: string | null;
      whatsappMessage?: string | null;
      phone?: string | null;
      email?: string | null;
      website?: string | null;
      instagram?: string | null;
    },
  ): string | null {
    switch (type) {
      case 'whatsapp':
        return profile.whatsapp
          ? this.generateWhatsAppUrl(profile.whatsapp, profile.whatsappMessage)
          : null;
      case 'phone':
        return profile.phone ? `tel:${profile.phone.replace(/\s/g, '')}` : null;
      case 'email':
        return profile.email ? `mailto:${profile.email}` : null;
      case 'website':
        return profile.website || null;
      case 'instagram':
        if (!profile.instagram) return null;
        // Handle both username and full URL
        if (profile.instagram.startsWith('http')) return profile.instagram;
        const handle = profile.instagram.replace(/^@/, '');
        return `https://instagram.com/${handle}`;
      default:
        return null;
    }
  }

  /**
   * Record a contact click and return the formatted URL.
   */
  async recordClick(
    providerProfileId: string,
    type: ContactClickType,
    options?: {
      clientUserId?: string;
      ipAddress?: string;
      userAgent?: string;
    },
  ): Promise<ServiceResult<{ url: string | null }>> {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { id: providerProfileId },
    });

    if (!profile) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Provider not found');
    }

    // Record the click asynchronously (fire and forget for performance)
    this.prisma.contactClick
      .create({
        data: {
          providerProfileId,
          type,
          clientUserId: options?.clientUserId || null,
          ipAddress: options?.ipAddress || null,
          userAgent: options?.userAgent || null,
        },
      })
      .catch(() => {
        // Silently ignore — analytics should not block the response
      });

    const url = this.generateContactUrl(type, profile as Record<string, unknown>);

    return ServiceResult.ok({ url });
  }

  /**
   * Get contact click stats for a provider (last N days).
   */
  async getClickStats(
    providerProfileId: string,
    days: number = 30,
  ): Promise<ServiceResult<unknown>> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const clicks = await this.prisma.contactClick.groupBy({
      by: ['type'],
      where: {
        providerProfileId,
        createdAt: { gte: since },
      },
      _count: { id: true },
    });

    const stats: Record<string, number> = {};
    for (const click of clicks) {
      stats[click.type] = click._count.id;
    }

    const total = Object.values(stats).reduce((sum, count) => sum + count, 0);

    return ServiceResult.ok({
      period: `${days}d`,
      since: since.toISOString(),
      total,
      byType: stats,
    });
  }

  /**
   * Get daily contact click stats for a provider.
   */
  async getDailyClickStats(
    providerProfileId: string,
    days: number = 30,
  ): Promise<ServiceResult<unknown>> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const clicks = await this.prisma.contactClick.findMany({
      where: {
        providerProfileId,
        createdAt: { gte: since },
      },
      select: {
        type: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date and type
    const dailyMap = new Map<string, Record<string, number>>();
    for (const click of clicks) {
      const dateKey = click.createdAt.toISOString().split('T')[0];
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, {});
      }
      const dayStats = dailyMap.get(dateKey)!;
      dayStats[click.type] = (dayStats[click.type] || 0) + 1;
    }

    const daily = Array.from(dailyMap.entries()).map(([date, byType]) => ({
      date,
      total: Object.values(byType).reduce((sum, c) => sum + c, 0),
      byType,
    }));

    return ServiceResult.ok({
      period: `${days}d`,
      since: since.toISOString(),
      daily,
    });
  }

  /**
   * Admin: aggregate contact clicks across all providers.
   */
  async getAdminContactAnalytics(
    days: number = 30,
  ): Promise<ServiceResult<unknown>> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const clicks = await this.prisma.contactClick.findMany({
      where: { createdAt: { gte: since } },
      select: {
        type: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Aggregate by type
    const byType: Record<string, number> = {};
    for (const click of clicks) {
      byType[click.type] = (byType[click.type] || 0) + 1;
    }

    // Aggregate by day
    const dailyMap = new Map<string, Record<string, number>>();
    for (const click of clicks) {
      const dateKey = click.createdAt.toISOString().split('T')[0];
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, {});
      }
      const dayStats = dailyMap.get(dateKey)!;
      dayStats[click.type] = (dayStats[click.type] || 0) + 1;
    }

    const daily = Array.from(dailyMap.entries()).map(([date, types]) => ({
      date,
      total: Object.values(types).reduce((sum, c) => sum + c, 0),
      byType: types,
    }));

    const total = Object.values(byType).reduce((sum, c) => sum + c, 0);

    return ServiceResult.ok({
      period: `${days}d`,
      since: since.toISOString(),
      total,
      byType,
      daily,
    });
  }
}
