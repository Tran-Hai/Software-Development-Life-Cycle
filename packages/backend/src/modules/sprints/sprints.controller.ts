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
import { ProjectPermissionGuard } from '../../common/guards/project-permission.guard';
import { RequiredPermission } from '../../common/decorators/required-permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('projects/:projectId/sprints')
@UseGuards(JwtAuthGuard, ProjectPermissionGuard)
export class SprintsController {
  constructor(private sprintsService: SprintsService) {}

  @Get()
  @RequiredPermission('sprint', 'read')
  async findAll(@Param('projectId') projectId: string) {
    return this.sprintsService.findAll(projectId);
  }

  @Post()
  @RequiredPermission('sprint', 'create')
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateSprintDto,
    @CurrentUser() user: any,
  ) {
    return this.sprintsService.create(projectId, user.id, dto);
  }

  @Get(':id')
  @RequiredPermission('sprint', 'read')
  async findOne(@Param('id') id: string) {
    return this.sprintsService.findOne(id);
  }

  @Patch(':id')
  @RequiredPermission('sprint', 'update')
  async update(@Param('id') id: string, @Body() dto: UpdateSprintDto) {
    return this.sprintsService.update(id, dto);
  }

  @Patch(':id/status')
  @RequiredPermission('sprint', 'update')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateSprintStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.sprintsService.updateStatus(id, user.id, dto);
  }

  @Delete(':id')
  @RequiredPermission('sprint', 'delete')
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.sprintsService.delete(id, user.id);
  }

  @Get(':id/burndown')
  @RequiredPermission('sprint', 'read')
  async getBurndown(@Param('id') id: string) {
    return this.sprintsService.getBurndownData(id);
  }
}
