import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { SearchFacadeService } from './search.service';
import { SearchQuerySchema, SearchQueryDto } from './dto/search-query.dto';

@ApiTags('Search')
@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchFacadeService: SearchFacadeService) {}

  @Get()
  async search(
    @CurrentTenant() tenantId: string,
    @Query(new ZodValidationPipe(SearchQuerySchema)) query: SearchQueryDto,
  ) {
    const result = await this.searchFacadeService.search(tenantId, query);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }
}
