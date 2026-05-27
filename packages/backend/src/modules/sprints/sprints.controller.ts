import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SprintsService } from './sprints.service';
import { CreateSprintDto, UpdateSprintDto, UpdateSprintStatusDto } from './dto/sprint.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('projects/:projectId/sprints')
@UseGuards(JwtAuthGuard)
export class SprintsController {
  constructor(private sprintsService: SprintsService) {}

  @Get()
  async findAll(@Param('projectId') projectId: string) {
    return this.sprintsService.findAll(projectId);
  }

  @Post()
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateSprintDto,
  ) {
    return this.sprintsService.create(projectId, dto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.sprintsService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateSprintDto) {
    return this.sprintsService.update(id, dto);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateSprintStatusDto,
  ) {
    return this.sprintsService.updateStatus(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.sprintsService.delete(id);
  }

  @Get(':id/burndown')
  async getBurndown(@Param('id') id: string) {
    return this.sprintsService.getBurndownData(id);
  }
}
