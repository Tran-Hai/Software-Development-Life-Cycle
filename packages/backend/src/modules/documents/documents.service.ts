import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateDocumentDto,
  UpdateDocumentDto,
  CreateDocumentCommentDto,
  CreateDocumentVersionDto,
} from './dto/document.dto';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async findAll(projectId: string) {
    return this.prisma.document.findMany({
      where: { projectId, parentId: null },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        children: {
          include: {
            author: {
              select: {
                id: true,
                email: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { position: 'asc' },
        },
      },
      orderBy: { position: 'asc' },
    });
  }

  async findBySlug(projectId: string, slug: string) {
    const document = await this.prisma.document.findFirst({
      where: { projectId, slug },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        children: {
          include: {
            author: {
              select: {
                id: true,
                email: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { position: 'asc' },
        },
        parent: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  async create(projectId: string, authorId: string, dto: CreateDocumentDto) {
    const doc = await this.prisma.document.create({
      data: {
        projectId,
        authorId,
        title: dto.title,
        content: dto.content,
        slug: dto.slug,
        parentId: dto.parentId,
        position: dto.position || 0,
        status: dto.status || 'draft',
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (dto.status === 'published') {
      const actor = await this.prisma.user.findUnique({ where: { id: authorId }, select: { fullName: true } });
      const actorName = actor?.fullName || 'Someone';
      await this.notifications.notifyProject(projectId, {
        type: 'document',
        title: `${actorName} created document "${doc.title}"`,
        entityType: 'document',
        entityId: doc.id,
      });
    }

    return doc;
  }

  async update(id: string, userId: string, dto: UpdateDocumentDto) {
    const existingDoc = await this.prisma.document.findUnique({
      where: { id },
    });

    if (!existingDoc) {
      throw new NotFoundException('Document not found');
    }

    const shouldCreateVersion =
      dto.content !== undefined && dto.content !== existingDoc.content;

    const updatedDoc = await this.prisma.document.update({
      where: { id },
      data: {
        ...dto,
        publishedAt:
          dto.status === 'published' && existingDoc.status !== 'published'
            ? new Date()
            : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (shouldCreateVersion) {
      const maxVersion = await this.prisma.documentVersion.aggregate({
        where: { documentId: id },
        _max: { versionNumber: true },
      });

      await this.prisma.documentVersion.create({
        data: {
          documentId: id,
          authorId: userId,
          content: existingDoc.content || '',
          versionNumber: (maxVersion._max.versionNumber || 0) + 1,
        },
      });
    }

    return updatedDoc;
  }

  async delete(id: string, userId?: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (userId) {
      const actor = await this.prisma.user.findUnique({ where: { id: userId }, select: { fullName: true } });
      const actorName = actor?.fullName || 'Someone';
      await this.notifications.notifyProject(document.projectId, {
        type: 'document',
        title: `${actorName} deleted document "${document.title}"`,
        entityType: 'document',
        entityId: id,
      });
    }

    return this.prisma.document.delete({
      where: { id },
    });
  }

  async getVersions(documentId: string) {
    return this.prisma.documentVersion.findMany({
      where: { documentId },
      orderBy: { versionNumber: 'desc' },
    });
  }

  async createVersion(documentId: string, authorId: string, dto: CreateDocumentVersionDto) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const maxVersion = await this.prisma.documentVersion.aggregate({
      where: { documentId },
      _max: { versionNumber: true },
    });

    return this.prisma.documentVersion.create({
      data: {
        documentId,
        authorId,
        content: dto.content,
        changeSummary: dto.changeSummary,
        versionNumber: (maxVersion._max.versionNumber || 0) + 1,
      },
    });
  }

  async getComments(documentId: string) {
    return this.prisma.documentComment.findMany({
      where: { documentId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addComment(documentId: string, authorId: string, dto: CreateDocumentCommentDto) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const comment = await this.prisma.documentComment.create({
      data: {
        documentId,
        authorId,
        content: dto.content,
        parentId: dto.parentId,
      },
    });

    if (document.authorId !== authorId) {
      const actor = await this.prisma.user.findUnique({ where: { id: authorId }, select: { fullName: true } });
      await this.notifications.notify({
        userId: document.authorId,
        type: 'comment',
        title: `${actor?.fullName || 'Someone'} commented on "${document.title}"`,
        body: dto.content?.slice(0, 100),
        entityType: 'document',
        entityId: documentId,
      });
    }

    return comment;
  }
}
