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
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequireProjectPermission } from '../../common/decorators/require-project-permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Post()
  async create(
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: any,
  ) {
    return this.projectsService.create(undefined, user.id, dto);
  }

  @Post('organizations/:organizationId')
  async createInOrg(
    @Param('organizationId') organizationId: string,
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: any,
  ) {
    return this.projectsService.create(organizationId, user.id, dto);
  }

  @Get()
  async findAll(@CurrentUser() user: any) {
    return this.projectsService.findAll(user.id);
  }

  @Get(':id')
  @RequireProjectPermission('project', 'read')
  async findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id, id);
  }

  @Patch(':id')
  @RequireProjectPermission('project', 'update')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: any,
  ) {
    return this.projectsService.update(id, user.id, dto);
  }

  @Delete(':id')
  @RequireProjectPermission('project', 'delete')
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.projectsService.delete(id, user.id);
  }
}
