import { Controller, Get, Query, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SearchQueryDto, GlobalSearchQueryDto } from './dto/search.dto';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get()
  async search(
    @Query() searchQuery: SearchQueryDto,
  ) {
    try {
      return await this.searchService.search(
        searchQuery.projectId,
        searchQuery.q,
        {
          type: searchQuery.type,
          status: searchQuery.status,
          limit: searchQuery.limit,
        },
      );
    } catch (error) {
      throw new HttpException(
        'Search failed. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('global')
  async searchGlobal(
    @CurrentUser() user: any,
    @Query() searchQuery: GlobalSearchQueryDto,
  ) {
    try {
      return await this.searchService.searchAllProjects(
        user.id,
        searchQuery.q,
        searchQuery.limit || 20,
      );
    } catch (error) {
      throw new HttpException(
        'Global search failed. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
