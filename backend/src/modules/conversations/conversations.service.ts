import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ServiceResult } from '../../common/types';
import { PaginatedResult, paginate } from '../../common/dto/pagination.dto';
import { ErrorCodes } from '../../common/constants/error-codes';
import { SendMessageDto } from './dto';

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listConversations(
    userId: string,
    page: number,
    pageSize: number,
    search?: string,
  ): Promise<ServiceResult<unknown>> {
    const where: Record<string, unknown> = {
      participantIds: { array_contains: [userId] },
    };

    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    const [items, totalCount] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { lastMessageAt: 'desc' },
      }),
      this.prisma.conversation.count({ where }),
    ]);

    return ServiceResult.ok(paginate(items, totalCount, { page, pageSize }));
  }

  async getMessages(
    conversationId: string,
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<ServiceResult<unknown>> {
    // Verify user is a participant
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Conversation not found');
    }

    const participantIds = conversation.participantIds as string[];
    if (!participantIds.includes(userId)) {
      return ServiceResult.fail(ErrorCodes.FORBIDDEN, 'Not a participant in this conversation');
    }

    const where = { conversationId };

    const [items, totalCount] = await Promise.all([
      this.prisma.message.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.message.count({ where }),
    ]);

    return ServiceResult.ok(paginate(items, totalCount, { page, pageSize }));
  }

  async sendMessage(
    conversationId: string,
    userId: string,
    senderType: string,
    dto: SendMessageDto,
  ): Promise<ServiceResult<unknown>> {
    // Verify user is a participant
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Conversation not found');
    }

    const participantIds = conversation.participantIds as string[];
    if (!participantIds.includes(userId)) {
      return ServiceResult.fail(ErrorCodes.FORBIDDEN, 'Not a participant in this conversation');
    }

    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          conversationId,
          senderId: userId,
          senderType,
          content: dto.content,
        },
      }),
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: new Date(),
        },
      }),
    ]);

    return ServiceResult.ok(message);
  }
}
