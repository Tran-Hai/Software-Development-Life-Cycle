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
import { EpicsService } from './epics.service';
import { CreateEpicDto, UpdateEpicDto } from './dto/epic.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ProjectPermissionGuard } from '../../common/guards/project-permission.guard';
import { RequiredPermission } from '../../common/decorators/required-permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('projects/:projectId/epics')
@UseGuards(JwtAuthGuard, ProjectPermissionGuard)
export class EpicsController {
  constructor(private epicsService: EpicsService) {}

  @Get()
  @RequiredPermission('epic', 'read')
  async findAll(@Param('projectId') projectId: string) {
    return this.epicsService.findAll(projectId);
  }

  @Post()
  @RequiredPermission('epic', 'create')
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateEpicDto,
    @CurrentUser() user: any,
  ) {
    return this.epicsService.create(projectId, user.id, dto);
  }

  @Get(':id')
  @RequiredPermission('epic', 'read')
  async findOne(@Param('id') id: string) {
    return this.epicsService.findOne(id);
  }

  @Patch(':id')
  @RequiredPermission('epic', 'update')
  async update(@Param('id') id: string, @Body() dto: UpdateEpicDto) {
    return this.epicsService.update(id, dto);
  }

  @Delete(':id')
  @RequiredPermission('epic', 'delete')
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.epicsService.delete(id, user.id);
  }
}
