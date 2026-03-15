import { z } from 'zod';

export const SearchQuerySchema = z.object({
  q: z.string().min(1).max(500),
  type: z
    .string()
    .optional()
    .describe('Entity type to search (e.g., providers, services, listings)'),
  filters: z.record(z.string()).optional(),
  sort: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  mode: z.enum(['fulltext', 'semantic', 'hybrid']).default('fulltext'),
});

export type SearchQueryDto = z.infer<typeof SearchQuerySchema>;
