import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { FeatureGateGuard } from '../../common/guards/feature-gate.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { FeatureGate } from '../../common/decorators/feature-gate.decorator';
import { Throttle } from '../../common/decorators/throttle.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AiService } from './ai.service';
import {
  ChatRequestSchema,
  ChatRequestDto,
  CreateConversationSchema,
  CreateConversationDto,
} from './dto/chat.dto';

@ApiTags('AI')
@Controller('api/v1/ai')
@UseGuards(JwtAuthGuard, RolesGuard, FeatureGateGuard)
@FeatureGate('ai-planner')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  @Throttle({ limit: 10, ttl: 60 })
  async chat(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub: string; userType: string },
    @Body(new ZodValidationPipe(ChatRequestSchema)) dto: ChatRequestDto,
    @Res() res: Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const stream = this.aiService.chat(tenantId, user.sub, dto);

    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  }

  @Post('conversations')
  @HttpCode(HttpStatus.CREATED)
  async createConversation(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub: string; userType: string },
    @Body(new ZodValidationPipe(CreateConversationSchema))
    dto: CreateConversationDto,
  ) {
    const result = await this.aiService.createConversation(
      tenantId,
      user.sub,
      user.userType,
      dto.title,
    );
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Get('conversations')
  async listConversations(
    @CurrentUser() user: { sub: string; userType: string },
  ) {
    const result = await this.aiService.listConversations(
      user.sub,
      user.userType,
    );
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Get('conversations/:id')
  async getConversation(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string },
  ) {
    const result = await this.aiService.getConversation(id, user.sub);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }
}
