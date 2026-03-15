import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface SimilarityResult {
  entityId: string;
  content: string;
  similarity: number;
}

export interface EmbeddingRecord {
  id: string;
  tenantId: string;
  entity: string;
  entityId: string;
  content: string;
}

@Injectable()
export class VectorSearchService {
  private readonly logger = new Logger(VectorSearchService.name);

  constructor(private readonly prisma: PrismaService) {}

  async storeEmbedding(
    tenantId: string,
    entity: string,
    entityId: string,
    content: string,
    vector: number[],
  ): Promise<void> {
    try {
      const vectorStr = `[${vector.join(',')}]`;
      await this.prisma.$executeRaw`
        INSERT INTO embeddings (id, tenant_id, entity, entity_id, content, vector, created_at)
        VALUES (gen_random_uuid(), ${tenantId}::uuid, ${entity}, ${entityId}::uuid, ${content}, ${vectorStr}::vector, NOW())
        ON CONFLICT (tenant_id, entity, entity_id)
        DO UPDATE SET content = EXCLUDED.content, vector = EXCLUDED.vector, created_at = NOW()
      `;

      this.logger.log(
        `Stored embedding for ${entity}:${entityId} (tenant ${tenantId})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to store embedding for ${entity}:${entityId}: ${error.message}`,
      );
      throw error;
    }
  }

  async removeEmbedding(
    tenantId: string,
    entity: string,
    entityId: string,
  ): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        DELETE FROM embeddings
        WHERE tenant_id = ${tenantId}::uuid AND entity = ${entity} AND entity_id = ${entityId}::uuid
      `;

      this.logger.log(
        `Removed embedding for ${entity}:${entityId} (tenant ${tenantId})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to remove embedding for ${entity}:${entityId}: ${error.message}`,
      );
      throw error;
    }
  }

  async removeAllForEntity(
    tenantId: string,
    entity: string,
  ): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        DELETE FROM embeddings
        WHERE tenant_id = ${tenantId}::uuid AND entity = ${entity}
      `;

      this.logger.log(
        `Removed all embeddings for entity type '${entity}' (tenant ${tenantId})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to remove embeddings for entity '${entity}': ${error.message}`,
      );
      throw error;
    }
  }

  async similaritySearch(
    tenantId: string,
    entity: string,
    queryVector: number[],
    limit: number = 10,
  ): Promise<SimilarityResult[]> {
    try {
      const vectorStr = `[${queryVector.join(',')}]`;
      const results = await this.prisma.$queryRaw<SimilarityResult[]>`
        SELECT
          entity_id AS "entityId",
          content,
          1 - (vector <=> ${vectorStr}::vector) AS similarity
        FROM embeddings
        WHERE tenant_id = ${tenantId}::uuid AND entity = ${entity}
        ORDER BY vector <=> ${vectorStr}::vector
        LIMIT ${limit}
      `;

      this.logger.log(
        `Similarity search for ${entity} (tenant ${tenantId}): ${results.length} results`,
      );

      return results;
    } catch (error) {
      this.logger.error(
        `Similarity search failed for ${entity} (tenant ${tenantId}): ${error.message}`,
      );
      throw error;
    }
  }

  async getEmbedding(
    tenantId: string,
    entity: string,
    entityId: string,
  ): Promise<EmbeddingRecord | null> {
    try {
      const results = await this.prisma.$queryRaw<EmbeddingRecord[]>`
        SELECT
          id,
          tenant_id AS "tenantId",
          entity,
          entity_id AS "entityId",
          content
        FROM embeddings
        WHERE tenant_id = ${tenantId}::uuid AND entity = ${entity} AND entity_id = ${entityId}::uuid
        LIMIT 1
      `;

      return results[0] ?? null;
    } catch (error) {
      this.logger.error(
        `Failed to get embedding for ${entity}:${entityId}: ${error.message}`,
      );
      throw error;
    }
  }
}
