import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { SendQuoteSchema, SendQuoteDto, UpdateStatusSchema, UpdateStatusDto } from './dto';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  async list(
    @CurrentTenant() tenantId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('eventType') eventType?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize || '20', 10) || 20));
    const filters: { status?: string; eventType?: string } = {};
    if (status) filters.status = status;
    if (eventType) filters.eventType = eventType;

    const result = await this.bookingsService.listBookings(
      tenantId,
      pageNum,
      pageSizeNum,
      Object.keys(filters).length > 0 ? filters : undefined,
    );
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Get('me')
  async listMine(
    @CurrentUser() user: { id: string },
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize || '20', 10) || 20));

    const result = await this.bookingsService.getClientBookings(
      user.id,
      pageNum,
      pageSizeNum,
    );
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Get('calendar')
  async calendar(
    @CurrentTenant() tenantId: string,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    const result = await this.bookingsService.getCalendarEvents(tenantId, start, end);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Get(':id')
  async get(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    const result = await this.bookingsService.getBooking(tenantId, id);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Post(':bookingId/quote')
  async sendQuote(
    @CurrentTenant() tenantId: string,
    @Param('bookingId') bookingId: string,
    @Body(new ZodValidationPipe(SendQuoteSchema)) dto: SendQuoteDto,
  ) {
    const result = await this.bookingsService.sendQuote(tenantId, bookingId, dto);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Patch(':bookingId/status')
  async updateStatus(
    @CurrentTenant() tenantId: string,
    @Param('bookingId') bookingId: string,
    @Body(new ZodValidationPipe(UpdateStatusSchema)) dto: UpdateStatusDto,
  ) {
    const result = await this.bookingsService.updateStatus(tenantId, bookingId, dto);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }
}
