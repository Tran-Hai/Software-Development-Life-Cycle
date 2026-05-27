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
import { DocumentsService } from './documents.service';
import {
  CreateDocumentDto,
  UpdateDocumentDto,
  CreateDocumentCommentDto,
  CreateDocumentVersionDto,
} from './dto/document.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ProjectPermissionGuard } from '../../common/guards/project-permission.guard';
import { RequiredPermission } from '../../common/decorators/required-permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('projects/:projectId/documents')
@UseGuards(JwtAuthGuard, ProjectPermissionGuard)
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Get()
  @RequiredPermission('document', 'read')
  async findAll(@Param('projectId') projectId: string) {
    return this.documentsService.findAll(projectId);
  }

  @Post()
  @RequiredPermission('document', 'create')
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateDocumentDto,
    @CurrentUser() user: any,
  ) {
    return this.documentsService.create(projectId, user.id, dto);
  }

  @Get('slug/:slug')
  @RequiredPermission('document', 'read')
  async findBySlug(
    @Param('projectId') projectId: string,
    @Param('slug') slug: string,
  ) {
    return this.documentsService.findBySlug(projectId, slug);
  }

  @Patch(':id')
  @RequiredPermission('document', 'update')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
    @CurrentUser() user: any,
  ) {
    return this.documentsService.update(id, user.id, dto);
  }

  @Delete(':id')
  @RequiredPermission('document', 'delete')
  async delete(@Param('id') id: string) {
    return this.documentsService.delete(id);
  }

  @Get(':id/versions')
  @RequiredPermission('document', 'read')
  async getVersions(@Param('id') id: string) {
    return this.documentsService.getVersions(id);
  }

  @Post(':id/versions')
  @RequiredPermission('document', 'update')
  async createVersion(
    @Param('id') id: string,
    @Body() dto: CreateDocumentVersionDto,
    @CurrentUser() user: any,
  ) {
    return this.documentsService.createVersion(id, user.id, dto);
  }

  @Get(':id/comments')
  @RequiredPermission('document', 'read')
  async getComments(@Param('id') id: string) {
    return this.documentsService.getComments(id);
  }

  @Post(':id/comments')
  @RequiredPermission('document', 'update')
  async addComment(
    @Param('id') id: string,
    @Body() dto: CreateDocumentCommentDto,
    @CurrentUser() user: any,
  ) {
    return this.documentsService.addComment(id, user.id, dto);
  }
}
