import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { NotificationsService } from './notifications.service';
import {
  NotificationQuerySchema,
  NotificationQueryDto,
} from './dto/notification-query.dto';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get()
  async findAll(
    @CurrentUser('id') userId: string,
    @CurrentUser('userType') userType: string,
    @Query(new ZodValidationPipe(NotificationQuerySchema))
    query: NotificationQueryDto,
  ) {
    const result = await this.notificationsService.findAll(
      userId,
      userType,
      query,
    );
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Get('unread-count')
  async getUnreadCount(
    @CurrentUser('id') userId: string,
    @CurrentUser('userType') userType: string,
  ) {
    const result = await this.notificationsService.getUnreadCount(
      userId,
      userType,
    );
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Patch(':id/read')
  async markRead(
    @CurrentUser('id') userId: string,
    @CurrentUser('userType') userType: string,
    @Param('id') notificationId: string,
  ) {
    const result = await this.notificationsService.markRead(
      userId,
      userType,
      notificationId,
    );
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllRead(
    @CurrentUser('id') userId: string,
    @CurrentUser('userType') userType: string,
  ) {
    const result = await this.notificationsService.markAllRead(
      userId,
      userType,
    );
    if (!result.success) throw result.toHttpException();
    return result.data;
  }
}
