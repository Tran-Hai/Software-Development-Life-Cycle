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
import { IssuesService } from './issues.service';
import {
  CreateIssueDto,
  UpdateIssueDto,
  CreateIssueCommentDto,
} from './dto/issue.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ProjectPermissionGuard } from '../../common/guards/project-permission.guard';
import { RequiredPermission } from '../../common/decorators/required-permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('projects/:projectId/issues')
@UseGuards(JwtAuthGuard, ProjectPermissionGuard)
export class IssuesController {
  constructor(private issuesService: IssuesService) {}

  @Get()
  @RequiredPermission('issue', 'read')
  async findAll(
    @Param('projectId') projectId: string,
    @Query('status') status?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('priority') priority?: string,
  ) {
    return this.issuesService.findAll(projectId, { status, assigneeId, priority });
  }

  @Post()
  @RequiredPermission('issue', 'create')
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateIssueDto,
    @CurrentUser() user: any,
  ) {
    return this.issuesService.create(projectId, user.id, dto);
  }

  @Get(':id')
  @RequiredPermission('issue', 'read')
  async findOne(@Param('id') id: string) {
    return this.issuesService.findOne(id);
  }

  @Patch(':id')
  @RequiredPermission('issue', 'update')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateIssueDto,
    @CurrentUser() user: any,
  ) {
    return this.issuesService.update(id, user.id, dto);
  }

  @Delete(':id')
  @RequiredPermission('issue', 'delete')
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.issuesService.delete(id, user.id);
  }

  @Get(':id/comments')
  @RequiredPermission('issue', 'read')
  async getComments(@Param('id') id: string) {
    return this.issuesService.getComments(id);
  }

  @Post(':id/comments')
  @RequiredPermission('issue', 'update')
  async addComment(
    @Param('id') id: string,
    @Body() dto: CreateIssueCommentDto,
    @CurrentUser() user: any,
  ) {
    return this.issuesService.addComment(id, user.id, dto);
  }

  @Get(':id/activity')
  @RequiredPermission('issue', 'read')
  async getActivity(@Param('id') id: string) {
    return this.issuesService.getActivity(id);
  }
}
