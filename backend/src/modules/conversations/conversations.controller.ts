import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { SendMessageSchema, SendMessageDto } from './dto';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  async list(
    @CurrentUser() user: { sub: string },
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize || '20', 10) || 20));

    const result = await this.conversationsService.listConversations(
      user.sub,
      pageNum,
      pageSizeNum,
      search,
    );
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Get(':conversationId/messages')
  async messages(
    @CurrentUser() user: { sub: string },
    @Param('conversationId') conversationId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize || '50', 10) || 50));

    const result = await this.conversationsService.getMessages(
      conversationId,
      user.sub,
      pageNum,
      pageSizeNum,
    );
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Post(':conversationId/messages')
  async send(
    @CurrentUser() user: { sub: string; userType: string },
    @Param('conversationId') conversationId: string,
    @Body(new ZodValidationPipe(SendMessageSchema)) dto: SendMessageDto,
  ) {
    const result = await this.conversationsService.sendMessage(
      conversationId,
      user.sub,
      user.userType,
      dto,
    );
    if (!result.success) throw result.toHttpException();
    return result.data;
  }
}
