import { z } from 'zod';
import { SearchFacadeService } from '../../search/search.service';

export const searchProvidersParametersSchema = z.object({
  categories: z
    .array(z.string())
    .describe('Service categories to search for (e.g. photography, catering, venue)'),
  location: z.string().optional().describe('City or area to search in'),
  maxBudget: z.number().optional().describe('Maximum budget in local currency'),
  minRating: z.number().optional().describe('Minimum rating (1-5)'),
});

export type SearchProvidersParameters = z.infer<typeof searchProvidersParametersSchema>;

async function executeSearchProviders(
  searchService: SearchFacadeService,
  tenantId: string,
  params: SearchProvidersParameters,
) {
  const filters: Record<string, string> = {};
  if (params.categories.length > 0) {
    filters.category = params.categories.join(',');
  }
  if (params.location) {
    filters.city = params.location;
  }

  const result = await searchService.search(tenantId, {
    q: params.categories.join(' '),
    mode: 'fulltext',
    type: 'providers',
    filters,
    page: 1,
    pageSize: 10,
  });

  if (!result.success || !result.data) {
    return { providers: [], total: 0 };
  }

  let hits = result.data.hits;

  if (params.minRating) {
    hits = hits.filter(
      (h) => typeof h.rating === 'number' && h.rating >= params.minRating!,
    );
  }

  if (params.maxBudget) {
    hits = hits.filter(
      (h) => typeof h.price !== 'number' || h.price <= params.maxBudget!,
    );
  }

  return {
    providers: hits.map((h) => ({
      id: h.id,
      name: String(h.name ?? 'Unknown'),
      category: String(h.category ?? 'general'),
      rating: typeof h.rating === 'number' ? h.rating : null,
      price: typeof h.price === 'number' ? h.price : null,
      location: String(h.city ?? h.location ?? ''),
    })),
    total: hits.length,
  };
}

export function createSearchProvidersTool(
  searchService: SearchFacadeService,
  tenantId: string,
) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { tool } = require('ai');
  return tool({
    description:
      'Search for service providers by category, location, budget, and rating',
    inputSchema: searchProvidersParametersSchema,
    execute: (params: SearchProvidersParameters) =>
      executeSearchProviders(searchService, tenantId, params),
  });
}

// Exported for testing without AI SDK dependency
export { executeSearchProviders };
