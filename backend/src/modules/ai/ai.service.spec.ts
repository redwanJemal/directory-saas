import { AiService } from './ai.service';
import { AppConfigService } from '../../config/app-config.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchFacadeService } from '../search/search.service';
import { AiProviderFactory } from './ai-provider.factory';

describe('AiService', () => {
  let service: AiService;
  let mockConfig: Partial<AppConfigService>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockPrisma: any;
  let mockSearchService: Record<string, jest.Mock>;
  let mockProviderFactory: Record<string, jest.Mock>;

  beforeEach(() => {
    mockConfig = {
      ai: {
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        apiKey: 'test-key',
        maxTokens: 4096,
        temperature: 0.7,
      },
    };

    mockPrisma = {
      aiConversation: {
        create: jest.fn().mockResolvedValue({
          id: 'conv-1',
          tenantId: 'tenant-1',
          userId: 'user-1',
          userType: 'tenant',
          title: 'Test Conversation',
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        findFirst: jest.fn().mockResolvedValue({
          id: 'conv-1',
          title: 'Test Conversation',
          messages: [{ role: 'user', content: 'Hello' }],
          userId: 'user-1',
        }),
        findMany: jest.fn().mockResolvedValue([
          { id: 'conv-1', title: 'Test 1', updatedAt: new Date() },
          { id: 'conv-2', title: 'Test 2', updatedAt: new Date() },
        ]),
        update: jest.fn().mockResolvedValue({}),
      },
    };

    mockSearchService = {
      search: jest.fn().mockResolvedValue({
        success: true,
        data: { hits: [], totalHits: 0, page: 1, pageSize: 20, processingTimeMs: 5, mode: 'fulltext', query: '' },
      }),
    };

    mockProviderFactory = {
      createModel: jest.fn().mockReturnValue('mock-model'),
      streamText: jest.fn(),
    };

    service = new AiService(
      mockConfig as AppConfigService,
      mockPrisma as PrismaService,
      mockSearchService as unknown as SearchFacadeService,
      mockProviderFactory as unknown as AiProviderFactory,
    );
  });

  describe('chat', () => {
    it('should stream text deltas from AI response', async () => {
      const mockFullStream = (async function* () {
        yield { type: 'text-delta', textDelta: 'Hello' };
        yield { type: 'text-delta', textDelta: ' world' };
        yield { type: 'finish' };
      })();

      mockProviderFactory.streamText.mockReturnValue({ fullStream: mockFullStream });

      const chunks: unknown[] = [];
      const stream = service.chat('tenant-1', 'user-1', {
        messages: [{ role: 'user', content: 'Plan my event' }],
      });

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(3);
      expect(chunks[0]).toEqual({ type: 'text-delta', content: 'Hello' });
      expect(chunks[1]).toEqual({ type: 'text-delta', content: ' world' });
      expect(chunks[2]).toEqual({ type: 'finish' });
    });

    it('should stream tool calls and results', async () => {
      const mockFullStream = (async function* () {
        yield {
          type: 'tool-call',
          toolName: 'searchProviders',
          toolCallId: 'call-1',
          args: { categories: ['photography'] },
        };
        yield {
          type: 'tool-result',
          toolName: 'searchProviders',
          toolCallId: 'call-1',
          result: { providers: [], total: 0 },
        };
        yield { type: 'finish' };
      })();

      mockProviderFactory.streamText.mockReturnValue({ fullStream: mockFullStream });

      const chunks: unknown[] = [];
      for await (const chunk of service.chat('tenant-1', 'user-1', {
        messages: [{ role: 'user', content: 'Find photographers' }],
      })) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(3);
      expect(chunks[0]).toEqual({
        type: 'tool-call',
        toolName: 'searchProviders',
        toolCallId: 'call-1',
        args: { categories: ['photography'] },
      });
      expect(chunks[1]).toEqual({
        type: 'tool-result',
        toolName: 'searchProviders',
        toolCallId: 'call-1',
        result: { providers: [], total: 0 },
      });
    });

    it('should yield error chunk on stream failure', async () => {
      mockProviderFactory.streamText.mockImplementation(() => {
        throw new Error('API key invalid');
      });

      const chunks: unknown[] = [];
      for await (const chunk of service.chat('tenant-1', 'user-1', {
        messages: [{ role: 'user', content: 'Hello' }],
      })) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toEqual({
        type: 'error',
        error: 'An error occurred while processing your request',
      });
    });

    it('should persist conversation when conversationId provided', async () => {
      const mockFullStream = (async function* () {
        yield { type: 'text-delta', textDelta: 'Hi' };
        yield { type: 'finish' };
      })();

      mockProviderFactory.streamText.mockReturnValue({ fullStream: mockFullStream });

      const chunks: unknown[] = [];
      for await (const chunk of service.chat('tenant-1', 'user-1', {
        messages: [{ role: 'user', content: 'Hello' }],
        conversationId: 'conv-1',
      })) {
        chunks.push(chunk);
      }

      expect(mockPrisma.aiConversation.findFirst).toHaveBeenCalledWith({
        where: { id: 'conv-1', userId: 'user-1' },
      });
      expect(mockPrisma.aiConversation.update).toHaveBeenCalled();
    });

    it('should pass correct options to streamText', async () => {
      const mockFullStream = (async function* () {
        yield { type: 'finish' };
      })();

      mockProviderFactory.streamText.mockReturnValue({ fullStream: mockFullStream });

      const chunks: unknown[] = [];
      for await (const chunk of service.chat('tenant-1', 'user-1', {
        messages: [{ role: 'user', content: 'Hello' }],
      })) {
        chunks.push(chunk);
      }

      expect(mockProviderFactory.createModel).toHaveBeenCalled();
      expect(mockProviderFactory.streamText).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'mock-model',
          maxTokens: 4096,
          temperature: 0.7,
          maxSteps: 5,
        }),
      );
    });

    it('should handle error stream events', async () => {
      const mockFullStream = (async function* () {
        yield { type: 'error', error: 'Rate limit exceeded' };
      })();

      mockProviderFactory.streamText.mockReturnValue({ fullStream: mockFullStream });

      const chunks: unknown[] = [];
      for await (const chunk of service.chat('tenant-1', 'user-1', {
        messages: [{ role: 'user', content: 'Hello' }],
      })) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toEqual({ type: 'error', error: 'Rate limit exceeded' });
    });
  });

  describe('createConversation', () => {
    it('should create a new conversation', async () => {
      const result = await service.createConversation(
        'tenant-1',
        'user-1',
        'tenant',
        'My Event Plan',
      );

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('conv-1');
      expect(result.data?.title).toBe('Test Conversation');
      expect(mockPrisma.aiConversation.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          userId: 'user-1',
          userType: 'tenant',
          title: 'My Event Plan',
          messages: [],
        },
      });
    });

    it('should create conversation with null title when not provided', async () => {
      await service.createConversation('tenant-1', 'user-1', 'tenant');

      expect(mockPrisma.aiConversation.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ title: null }),
      });
    });
  });

  describe('getConversation', () => {
    it('should return conversation by id and userId', async () => {
      const result = await service.getConversation('conv-1', 'user-1');

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('conv-1');
      expect(result.data?.messages).toHaveLength(1);
    });

    it('should return NOT_FOUND when conversation does not exist', async () => {
      mockPrisma.aiConversation.findFirst.mockResolvedValue(null);

      const result = await service.getConversation('conv-999', 'user-1');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });
  });

  describe('listConversations', () => {
    it('should list conversations for user', async () => {
      const result = await service.listConversations('user-1', 'tenant');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(mockPrisma.aiConversation.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', userType: 'tenant' },
        orderBy: { updatedAt: 'desc' },
        select: { id: true, title: true, updatedAt: true },
        take: 50,
      });
    });
  });
});
