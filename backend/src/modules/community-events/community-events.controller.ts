import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { CommunityEventsService } from './community-events.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateCommunityEventSchema,
  CreateCommunityEventDto,
  UpdateCommunityEventSchema,
  UpdateCommunityEventDto,
  CreateRsvpSchema,
  CreateRsvpDto,
} from './dto';

// === Provider Events CRUD ===

@Controller('providers/me/events')
@UseGuards(JwtAuthGuard)
export class ProviderEventsController {
  constructor(private readonly eventsService: CommunityEventsService) {}

  @Get()
  async list(
    @CurrentTenant() tenantId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize || '20', 10) || 20));

    const result = await this.eventsService.listProviderEvents(tenantId, pageNum, pageSizeNum);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentTenant() tenantId: string,
    @Body(new ZodValidationPipe(CreateCommunityEventSchema)) dto: CreateCommunityEventDto,
  ) {
    const result = await this.eventsService.createEvent(tenantId, dto);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Patch(':id')
  async update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateCommunityEventSchema)) dto: UpdateCommunityEventDto,
  ) {
    const result = await this.eventsService.updateEvent(tenantId, id, dto);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Delete(':id')
  async delete(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    const result = await this.eventsService.deleteEvent(tenantId, id);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }
}

// === Public Events ===

@Controller('community-events')
export class PublicEventsController {
  constructor(private readonly eventsService: CommunityEventsService) {}

  @Get()
  @Public()
  async listEvents(
    @Query('country') country?: string,
    @Query('city') city?: string,
    @Query('category') category?: string,
    @Query('eventType') eventType?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const result = await this.eventsService.listPublicEvents({
      country,
      city,
      category,
      eventType,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Get('upcoming')
  @Public()
  async getUpcomingEvents() {
    const result = await this.eventsService.getUpcomingEvents();
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Get(':id')
  @Public()
  async getEventById(@Param('id') id: string) {
    const result = await this.eventsService.getEventById(id);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Get('provider/:providerId')
  @Public()
  async getProviderEvents(
    @Param('providerId') providerId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize || '20', 10) || 20));

    const result = await this.eventsService.getProviderEvents(providerId, pageNum, pageSizeNum);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  // === RSVP (requires auth) ===

  @Post(':id/rsvp')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async rsvp(
    @Param('id') eventId: string,
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(CreateRsvpSchema)) dto: CreateRsvpDto,
  ) {
    const result = await this.eventsService.rsvpToEvent(eventId, userId, dto);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Get(':id/rsvp/me')
  @UseGuards(JwtAuthGuard)
  async getMyRsvp(
    @Param('id') eventId: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.eventsService.getUserRsvp(eventId, userId);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Delete(':id/rsvp')
  @UseGuards(JwtAuthGuard)
  async removeRsvp(
    @Param('id') eventId: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.eventsService.removeRsvp(eventId, userId);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }
}
