import { executeSearchProviders } from './search-providers.tool';
import { SearchFacadeService } from '../../search/search.service';
import { ServiceResult } from '../../../common/types';

describe('searchProviders tool', () => {
  let mockSearchService: Record<string, jest.Mock>;

  beforeEach(() => {
    mockSearchService = {
      search: jest.fn().mockResolvedValue(
        ServiceResult.ok({
          hits: [
            {
              id: 'p-1',
              name: 'Photo Studio A',
              category: 'photography',
              rating: 4.8,
              price: 5000,
              city: 'Addis Ababa',
            },
            {
              id: 'p-2',
              name: 'Photo Studio B',
              category: 'photography',
              rating: 3.5,
              price: 3000,
              city: 'Addis Ababa',
            },
          ],
          totalHits: 2,
          page: 1,
          pageSize: 10,
          processingTimeMs: 5,
          mode: 'fulltext',
          query: 'photography',
        }),
      ),
    };
  });

  it('should search and return provider results', async () => {
    const result = await executeSearchProviders(
      mockSearchService as unknown as SearchFacadeService,
      'tenant-1',
      { categories: ['photography'] },
    );

    expect(result.providers).toHaveLength(2);
    expect(result.providers[0].id).toBe('p-1');
    expect(result.providers[0].name).toBe('Photo Studio A');
    expect(mockSearchService.search).toHaveBeenCalledWith('tenant-1', {
      q: 'photography',
      mode: 'fulltext',
      type: 'providers',
      filters: { category: 'photography' },
      page: 1,
      pageSize: 10,
    });
  });

  it('should filter by minimum rating', async () => {
    const result = await executeSearchProviders(
      mockSearchService as unknown as SearchFacadeService,
      'tenant-1',
      { categories: ['photography'], minRating: 4.0 },
    );

    expect(result.providers).toHaveLength(1);
    expect(result.providers[0].id).toBe('p-1');
  });

  it('should filter by max budget', async () => {
    const result = await executeSearchProviders(
      mockSearchService as unknown as SearchFacadeService,
      'tenant-1',
      { categories: ['photography'], maxBudget: 4000 },
    );

    expect(result.providers).toHaveLength(1);
    expect(result.providers[0].id).toBe('p-2');
  });

  it('should return empty on search failure', async () => {
    mockSearchService.search.mockResolvedValue(
      ServiceResult.fail('INTERNAL_ERROR', 'Search failed'),
    );

    const result = await executeSearchProviders(
      mockSearchService as unknown as SearchFacadeService,
      'tenant-1',
      { categories: ['photography'] },
    );

    expect(result.providers).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('should pass location as filter', async () => {
    await executeSearchProviders(
      mockSearchService as unknown as SearchFacadeService,
      'tenant-1',
      { categories: ['venue'], location: 'Addis Ababa' },
    );

    expect(mockSearchService.search).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({
        filters: { category: 'venue', city: 'Addis Ababa' },
      }),
    );
  });
});
