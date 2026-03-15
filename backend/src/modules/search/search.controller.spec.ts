import { Test, TestingModule } from '@nestjs/testing';
import { SearchController } from './search.controller';
import { SearchFacadeService } from './search.service';
import { ServiceResult } from '../../common/types';

describe('SearchController', () => {
  let controller: SearchController;
  let mockFacadeService: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockFacadeService = {
      search: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [
        { provide: SearchFacadeService, useValue: mockFacadeService },
      ],
    }).compile();

    controller = module.get<SearchController>(SearchController);
  });

  describe('search', () => {
    it('should return search results on success', async () => {
      const searchResult = {
        hits: [{ id: 'hit-1', entity: 'providers' }],
        query: 'wedding',
        totalHits: 1,
        page: 1,
        pageSize: 20,
        processingTimeMs: 10,
        mode: 'fulltext',
      };

      mockFacadeService.search.mockResolvedValue(
        ServiceResult.ok(searchResult),
      );

      const result = await controller.search('tenant-1', {
        q: 'wedding',
        mode: 'fulltext',
        page: 1,
        pageSize: 20,
      });

      expect(result).toEqual(searchResult);
      expect(mockFacadeService.search).toHaveBeenCalledWith('tenant-1', {
        q: 'wedding',
        mode: 'fulltext',
        page: 1,
        pageSize: 20,
      });
    });

    it('should throw on service failure', async () => {
      mockFacadeService.search.mockResolvedValue(
        ServiceResult.fail('INTERNAL_ERROR', 'Search failed'),
      );

      await expect(
        controller.search('tenant-1', {
          q: 'test',
          mode: 'fulltext',
          page: 1,
          pageSize: 20,
        }),
      ).rejects.toThrow();
    });
  });
});
