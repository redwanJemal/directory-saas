# Task 22: Full-Text & Vector Search

## Summary
Implement dual search infrastructure: Meilisearch for fast full-text search and pgvector for semantic/AI-powered similarity search. Both are tenant-scoped.

## Current State
- Meilisearch running via Docker (Task 01/26).
- pgvector extension installed (Task 02).

## Required Changes

### 22.1 Meilisearch Service

**File**: `backend/src/common/services/search.service.ts`

```typescript
@Injectable()
export class SearchService {
  // Index management
  async createIndex(indexName: string, primaryKey: string, searchableAttributes: string[], filterableAttributes: string[]): Promise<void>;

  // Document management (tenant-scoped)
  async index(indexName: string, tenantId: string, documents: any[]): Promise<void>;
  async remove(indexName: string, tenantId: string, documentIds: string[]): Promise<void>;

  // Search
  async search(indexName: string, tenantId: string, query: string, options?: SearchOptions): Promise<SearchResult>;
}
```

**Tenant isolation in Meilisearch**: Add `tenantId` as filterable attribute. Every search automatically filters by tenant.

### 22.2 Vector Search (pgvector)

Add to Prisma schema:
```prisma
model Embedding {
  id        String   @id @default(uuid()) @db.Uuid
  tenantId  String   @map("tenant_id") @db.Uuid
  entity    String                      // 'provider', 'service', 'listing'
  entityId  String   @map("entity_id") @db.Uuid
  content   String                      // Original text that was embedded
  vector    Unsupported("vector(1536)") // OpenAI-compatible dimensions
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz

  @@index([tenantId, entity])
  @@map("embeddings")
}
```

**Vector service**: Uses raw SQL for pgvector operations:
```typescript
async similaritySearch(tenantId: string, entity: string, queryVector: number[], limit: number): Promise<SimilarityResult[]> {
  return this.prisma.$queryRaw`
    SELECT entity_id, content, 1 - (vector <=> ${queryVector}::vector) as similarity
    FROM embeddings
    WHERE tenant_id = ${tenantId} AND entity = ${entity}
    ORDER BY vector <=> ${queryVector}::vector
    LIMIT ${limit}
  `;
}
```

### 22.3 Search Index Sync

Use event system (Task 17) to keep search indexes in sync:
```typescript
@OnEvent('entity.created', { async: true })
async onEntityCreated(event: EntityCreatedEvent) {
  await this.searchService.index(event.entity, event.tenantId, [event.data]);
}
```

Index updates go through BullMQ `indexing` queue for reliability.

### 22.4 Search Endpoint

- `GET /api/v1/search?q=wedding+photographer&type=providers` — Unified search
- Searches Meilisearch for full-text, falls back to pgvector for semantic

### 22.5 Tests

- Test: Document indexed in Meilisearch with tenantId
- Test: Search returns only current tenant's results
- Test: Search with filters (category, status)
- Test: Vector similarity search returns ranked results
- Test: Event triggers index update
- Test: Remove from index on entity delete

## Acceptance Criteria

1. Meilisearch for fast full-text search
2. pgvector for semantic similarity search
3. Tenant isolation in both search systems
4. Event-driven index synchronization
5. Unified search endpoint
6. All tests pass
