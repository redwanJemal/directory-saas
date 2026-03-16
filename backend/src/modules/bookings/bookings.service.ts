import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ServiceResult } from '../../common/types';
import { PaginatedResult, paginate } from '../../common/dto/pagination.dto';
import { ErrorCodes } from '../../common/constants/error-codes';
import { SendQuoteDto, UpdateStatusDto } from './dto';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async listBookings(
    tenantId: string,
    page: number,
    pageSize: number,
    filters?: { status?: string; eventType?: string },
  ): Promise<ServiceResult<unknown>> {
    const where: Record<string, unknown> = { tenantId };
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.eventType) {
      where.eventType = filters.eventType;
    }

    const [items, totalCount] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: {
          client: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return ServiceResult.ok(paginate(items, totalCount, { page, pageSize }));
  }

  async getBooking(
    tenantId: string,
    bookingId: string,
  ): Promise<ServiceResult<unknown>> {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, tenantId },
      include: {
        client: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!booking) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Booking not found');
    }

    return ServiceResult.ok(booking);
  }

  async getClientBookings(
    clientId: string,
    page: number,
    pageSize: number,
  ): Promise<ServiceResult<unknown>> {
    const where = { clientId };

    const [items, totalCount] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return ServiceResult.ok(paginate(items, totalCount, { page, pageSize }));
  }

  async sendQuote(
    tenantId: string,
    bookingId: string,
    dto: SendQuoteDto,
  ): Promise<ServiceResult<unknown>> {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, tenantId },
    });

    if (!booking) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Booking not found');
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        totalAmount: dto.totalAmount,
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });

    return ServiceResult.ok(updated);
  }

  async updateStatus(
    tenantId: string,
    bookingId: string,
    dto: UpdateStatusDto,
  ): Promise<ServiceResult<unknown>> {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, tenantId },
    });

    if (!booking) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Booking not found');
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: dto.status },
    });

    return ServiceResult.ok(updated);
  }

  async getCalendarEvents(
    tenantId: string,
    startDate: string,
    endDate: string,
  ): Promise<ServiceResult<unknown>> {
    const bookings = await this.prisma.booking.findMany({
      where: {
        tenantId,
        eventDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: {
        client: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { eventDate: 'asc' },
    });

    return ServiceResult.ok(bookings);
  }
}
