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
import { CurrentUser } from '../../common/decorators/current-user.decorator';

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
    @CurrentUser() user: any,
  ) {
    return this.sprintsService.create(projectId, user.id, dto);
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
    @CurrentUser() user: any,
  ) {
    return this.sprintsService.updateStatus(id, user.id, dto);
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
