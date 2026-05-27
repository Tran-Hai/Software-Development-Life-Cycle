import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BugsService } from './bugs.service';
import { CreateBugDto, UpdateBugDto } from './dto/bug.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('projects/:projectId/bugs')
@UseGuards(JwtAuthGuard)
export class BugsController {
  constructor(private bugsService: BugsService) {}

  @Get()
  async findAll(
    @Param('projectId') projectId: string,
    @Query('status') status?: string,
    @Query('severity') severity?: string,
    @Query('assigneeId') assigneeId?: string,
  ) {
    return this.bugsService.findAll(projectId, { status, severity, assigneeId });
  }

  @Get('stats')
  async getStats(@Param('projectId') projectId: string) {
    return this.bugsService.getStats(projectId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.bugsService.findOne(id);
  }

  @Post()
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateBugDto,
    @CurrentUser() user: any,
  ) {
    return this.bugsService.create(projectId, user.id, dto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBugDto,
    @CurrentUser() user: any,
  ) {
    return this.bugsService.update(id, dto, user.id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.bugsService.delete(id);
  }
}
