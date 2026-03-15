import { AiController } from './ai.controller';
import { AiService, StreamChunk } from './ai.service';
import { ServiceResult } from '../../common/types';

describe('AiController', () => {
  let controller: AiController;
  let mockAiService: Record<string, jest.Mock>;
  let mockResponse: Record<string, jest.Mock>;

  beforeEach(() => {
    mockAiService = {
      chat: jest.fn(),
      createConversation: jest.fn(),
      listConversations: jest.fn(),
      getConversation: jest.fn(),
    };

    mockResponse = {
      setHeader: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
    };

    controller = new AiController(
      mockAiService as unknown as AiService,
    );
  });

  describe('chat', () => {
    it('should set SSE headers and stream chunks', async () => {
      const chunks: StreamChunk[] = [
        { type: 'text-delta', content: 'Hello' },
        { type: 'finish' },
      ];

      mockAiService.chat.mockReturnValue(
        (async function* () {
          for (const chunk of chunks) {
            yield chunk;
          }
        })(),
      );

      await controller.chat(
        'tenant-1',
        { sub: 'user-1', userType: 'tenant' },
        { messages: [{ role: 'user', content: 'Hi' }] },
        mockResponse as never,
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/event-stream',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Cache-Control',
        'no-cache',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Connection',
        'keep-alive',
      );
      expect(mockResponse.write).toHaveBeenCalledWith(
        `data: ${JSON.stringify(chunks[0])}\n\n`,
      );
      expect(mockResponse.write).toHaveBeenCalledWith(
        `data: ${JSON.stringify(chunks[1])}\n\n`,
      );
      expect(mockResponse.write).toHaveBeenCalledWith('data: [DONE]\n\n');
      expect(mockResponse.end).toHaveBeenCalled();
    });

    it('should stream tool call events', async () => {
      const chunks: StreamChunk[] = [
        {
          type: 'tool-call',
          toolName: 'searchProviders',
          toolCallId: 'call-1',
          args: { categories: ['venue'] },
        },
        {
          type: 'tool-result',
          toolName: 'searchProviders',
          toolCallId: 'call-1',
          result: { providers: [], total: 0 },
        },
        { type: 'finish' },
      ];

      mockAiService.chat.mockReturnValue(
        (async function* () {
          for (const chunk of chunks) {
            yield chunk;
          }
        })(),
      );

      await controller.chat(
        'tenant-1',
        { sub: 'user-1', userType: 'tenant' },
        { messages: [{ role: 'user', content: 'Find venues' }] },
        mockResponse as never,
      );

      expect(mockResponse.write).toHaveBeenCalledTimes(4); // 3 chunks + [DONE]
    });
  });

  describe('createConversation', () => {
    it('should create conversation and return data', async () => {
      mockAiService.createConversation.mockResolvedValue(
        ServiceResult.ok({ id: 'conv-1', title: 'Test' }),
      );

      const result = await controller.createConversation(
        'tenant-1',
        { sub: 'user-1', userType: 'tenant' },
        { title: 'Test' },
      );

      expect(result).toEqual({ id: 'conv-1', title: 'Test' });
    });

    it('should throw on failure', async () => {
      mockAiService.createConversation.mockResolvedValue(
        ServiceResult.fail('INTERNAL_ERROR', 'DB error'),
      );

      await expect(
        controller.createConversation(
          'tenant-1',
          { sub: 'user-1', userType: 'tenant' },
          { title: 'Test' },
        ),
      ).rejects.toThrow();
    });
  });

  describe('listConversations', () => {
    it('should return list of conversations', async () => {
      const conversations = [
        { id: 'conv-1', title: 'Test 1', updatedAt: new Date() },
      ];
      mockAiService.listConversations.mockResolvedValue(
        ServiceResult.ok(conversations),
      );

      const result = await controller.listConversations({
        sub: 'user-1',
        userType: 'tenant',
      });

      expect(result).toEqual(conversations);
    });
  });

  describe('getConversation', () => {
    it('should return conversation by id', async () => {
      mockAiService.getConversation.mockResolvedValue(
        ServiceResult.ok({ id: 'conv-1', title: 'Test', messages: [] }),
      );

      const result = await controller.getConversation('conv-1', {
        sub: 'user-1',
      });

      expect(result).toEqual({ id: 'conv-1', title: 'Test', messages: [] });
    });

    it('should throw when conversation not found', async () => {
      mockAiService.getConversation.mockResolvedValue(
        ServiceResult.fail('NOT_FOUND', 'Conversation not found'),
      );

      await expect(
        controller.getConversation('conv-999', { sub: 'user-1' }),
      ).rejects.toThrow();
    });
  });
});
