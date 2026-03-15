import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ServiceResult } from '../../common/types';
import { SearchFacadeService } from '../search/search.service';
import { AiProviderFactory } from './ai-provider.factory';
import { createSearchProvidersTool } from './tools/search-providers.tool';
import { createEstimateBudgetTool } from './tools/estimate-budget.tool';
import { createCheckAvailabilityTool } from './tools/check-availability.tool';
import { createPlanTool } from './tools/create-plan.tool';
import { PLANNER_SYSTEM_PROMPT } from './prompts/planner.prompt';
import { ChatRequestDto } from './dto/chat.dto';

export interface StreamChunk {
  type: 'text-delta' | 'tool-call' | 'tool-result' | 'finish' | 'error';
  content?: string;
  toolName?: string;
  toolCallId?: string;
  args?: unknown;
  result?: unknown;
  error?: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly config: AppConfigService,
    private readonly prisma: PrismaService,
    private readonly searchService: SearchFacadeService,
    private readonly providerFactory: AiProviderFactory,
  ) {}

  async *chat(
    tenantId: string,
    userId: string,
    dto: ChatRequestDto,
  ): AsyncGenerator<StreamChunk> {
    const { maxTokens, temperature } = this.config.ai;

    const coreMessages = dto.messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    try {
      const model = this.providerFactory.createModel();
      const result = this.providerFactory.streamText({
        model,
        system: PLANNER_SYSTEM_PROMPT,
        messages: coreMessages,
        tools: {
          searchProviders: createSearchProvidersTool(
            this.searchService,
            tenantId,
          ),
          estimateBudget: createEstimateBudgetTool(),
          checkAvailability: createCheckAvailabilityTool(),
          createPlan: createPlanTool(),
        },
        maxTokens,
        temperature,
        maxSteps: 5,
      });

      for await (const part of result.fullStream) {
        if (part.type === 'text-delta') {
          yield { type: 'text-delta', content: part.textDelta };
        } else if (part.type === 'tool-call') {
          yield {
            type: 'tool-call',
            toolName: part.toolName,
            toolCallId: part.toolCallId,
            args: part.args,
          };
        } else if (part.type === 'tool-result') {
          yield {
            type: 'tool-result',
            toolName: part.toolName,
            toolCallId: part.toolCallId,
            result: part.result,
          };
        } else if (part.type === 'error') {
          yield { type: 'error', error: String(part.error) };
        } else if (part.type === 'finish') {
          yield { type: 'finish' };
        }
      }

      // Persist conversation if conversationId provided
      if (dto.conversationId) {
        await this.appendMessages(dto.conversationId, userId, dto.messages);
      }
    } catch (error) {
      this.logger.error(`AI chat error: ${error.message}`, error.stack);
      yield {
        type: 'error',
        error: 'An error occurred while processing your request',
      };
    }
  }

  async createConversation(
    tenantId: string | null,
    userId: string,
    userType: string,
    title?: string,
  ): Promise<ServiceResult<{ id: string; title: string | null }>> {
    const conversation = await this.prisma.aiConversation.create({
      data: {
        tenantId,
        userId,
        userType,
        title: title ?? null,
        messages: [],
      },
    });

    return ServiceResult.ok({ id: conversation.id, title: conversation.title });
  }

  async getConversation(
    conversationId: string,
    userId: string,
  ): Promise<ServiceResult<{ id: string; title: string | null; messages: unknown[] }>> {
    const conversation = await this.prisma.aiConversation.findFirst({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      return ServiceResult.fail('NOT_FOUND', 'Conversation not found');
    }

    return ServiceResult.ok({
      id: conversation.id,
      title: conversation.title,
      messages: conversation.messages as unknown[],
    });
  }

  async listConversations(
    userId: string,
    userType: string,
  ): Promise<ServiceResult<Array<{ id: string; title: string | null; updatedAt: Date }>>> {
    const conversations = await this.prisma.aiConversation.findMany({
      where: { userId, userType },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, updatedAt: true },
      take: 50,
    });

    return ServiceResult.ok(conversations);
  }

  private async appendMessages(
    conversationId: string,
    userId: string,
    newMessages: Array<{ role: string; content: string }>,
  ): Promise<void> {
    try {
      const conversation = await this.prisma.aiConversation.findFirst({
        where: { id: conversationId, userId },
      });

      if (!conversation) return;

      const existing = (conversation.messages as unknown[]) ?? [];
      const updated = [...existing, ...newMessages];

      await this.prisma.aiConversation.update({
        where: { id: conversationId },
        data: { messages: updated as never },
      });
    } catch (error) {
      this.logger.error(
        `Failed to persist conversation ${conversationId}: ${error.message}`,
      );
    }
  }
}
