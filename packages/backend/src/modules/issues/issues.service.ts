import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateIssueDto,
  UpdateIssueDto,
  CreateIssueCommentDto,
} from './dto/issue.dto';

@Injectable()
export class IssuesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async findAll(projectId: string, filters?: { status?: string; assigneeId?: string; priority?: string }) {
    return this.prisma.issue.findMany({
      where: {
        projectId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.assigneeId && { assigneeId: filters.assigneeId }),
        ...(filters?.priority && { priority: filters.priority }),
      },
      include: {
        issueType: true,
        assignee: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        reporter: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        sprint: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        _count: {
          select: {
            comments: true,
            subtasks: true,
          },
        },
      },
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string) {
    const issue = await this.prisma.issue.findUnique({
      where: { id },
      include: {
        issueType: true,
        assignee: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        reporter: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        sprint: true,
        epic: true,
        parent: true,
        subtasks: {
          include: {
            issueType: true,
            assignee: {
              select: {
                id: true,
                email: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: {
            comments: true,
            attachments: true,
          },
        },
      },
    });

    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    return issue;
  }

  async create(projectId: string, userId: string, dto: CreateIssueDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const issueType = await this.prisma.issueType.findUnique({
      where: { id: dto.issueTypeId },
    });

    if (!issueType) {
      throw new NotFoundException('Issue type not found');
    }

    const issueNumber = await this.generateIssueNumber(projectId, project.key);

    const issue = await this.prisma.issue.create({
      data: {
        projectId,
        issueNumber,
        issueTypeId: dto.issueTypeId,
        epicId: dto.epicId,
        sprintId: dto.sprintId,
        assigneeId: dto.assigneeId,
        reporterId: userId,
        parentId: dto.parentId,
        title: dto.title,
        description: dto.description,
        status: dto.status || 'backlog',
        priority: dto.priority || 'medium',
        storyPoints: dto.storyPoints,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      },
      include: {
        issueType: true,
        assignee: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    await this.logActivity(issue.id, userId, 'created', null, {
      title: issue.title,
      status: issue.status,
    });

    const actor = await this.prisma.user.findUnique({ where: { id: userId }, select: { fullName: true } });
    const actorName = actor?.fullName || 'Someone';

    if (dto.assigneeId && dto.assigneeId !== userId) {
      await this.notifications.notify({
        userId: dto.assigneeId,
        type: 'assignment',
        title: `${actorName} assigned you to ${issue.issueNumber}`,
        body: issue.title,
        entityType: 'issue',
        entityId: issue.id,
      });
    }

    return issue;
  }

  async update(id: string, userId: string, dto: UpdateIssueDto) {
    const existingIssue = await this.prisma.issue.findUnique({
      where: { id },
    });

    if (!existingIssue) {
      throw new NotFoundException('Issue not found');
    }

    const oldValues: Record<string, any> = {};
    const newValues: Record<string, any> = {};

    if (dto.status && dto.status !== existingIssue.status) {
      oldValues.status = existingIssue.status;
      newValues.status = dto.status;
    }

    if (dto.assigneeId && dto.assigneeId !== existingIssue.assigneeId) {
      oldValues.assigneeId = existingIssue.assigneeId;
      newValues.assigneeId = dto.assigneeId;
    }

    if (dto.priority && dto.priority !== existingIssue.priority) {
      oldValues.priority = existingIssue.priority;
      newValues.priority = dto.priority;
    }

    const resolvedAt =
      dto.status === 'done' && existingIssue.status !== 'done'
        ? new Date()
        : dto.status !== 'done'
          ? null
          : undefined;

    const issue = await this.prisma.issue.update({
      where: { id },
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        resolvedAt,
      },
      include: {
        issueType: true,
        assignee: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (Object.keys(oldValues).length > 0) {
      await this.logActivity(id, userId, 'updated', oldValues, newValues);
    }

    const actor = await this.prisma.user.findUnique({ where: { id: userId }, select: { fullName: true } });
    const actorName = actor?.fullName || 'Someone';

    if (dto.assigneeId && dto.assigneeId !== existingIssue.assigneeId && dto.assigneeId !== userId) {
      await this.notifications.notify({
        userId: dto.assigneeId,
        type: 'assignment',
        title: `${actorName} assigned you to ${existingIssue.issueNumber}`,
        body: existingIssue.title,
        entityType: 'issue',
        entityId: id,
      });
    }

    if (dto.status && dto.status !== existingIssue.status) {
      if (existingIssue.assigneeId && existingIssue.assigneeId !== userId) {
        await this.notifications.notify({
          userId: existingIssue.assigneeId,
          type: 'status_change',
          title: `${actorName} changed ${existingIssue.issueNumber} to ${dto.status}`,
          entityType: 'issue',
          entityId: id,
        });
      }
    }

    return issue;
  }

  async delete(id: string) {
    const issue = await this.prisma.issue.findUnique({
      where: { id },
    });

    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    return this.prisma.issue.delete({
      where: { id },
    });
  }

  async addComment(issueId: string, userId: string, dto: CreateIssueCommentDto) {
    const issue = await this.prisma.issue.findUnique({
      where: { id: issueId },
    });

    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    const comment = await this.prisma.issueComment.create({
      data: {
        issueId,
        authorId: userId,
        content: dto.content,
        parentId: dto.parentId,
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

    await this.logActivity(issueId, userId, 'commented', null, {
      commentId: comment.id,
    });

    const actor = await this.prisma.user.findUnique({ where: { id: userId }, select: { fullName: true } });
    const actorName = actor?.fullName || 'Someone';

    const notifyUsers = new Set<string>();
    if (issue.assigneeId && issue.assigneeId !== userId) notifyUsers.add(issue.assigneeId);
    if (issue.reporterId && issue.reporterId !== userId) notifyUsers.add(issue.reporterId);

    for (const targetId of notifyUsers) {
      await this.notifications.notify({
        userId: targetId,
        type: 'comment',
        title: `${actorName} commented on ${issue.issueNumber}`,
        body: dto.content?.slice(0, 100),
        entityType: 'issue',
        entityId: issueId,
      });
    }

    return comment;
  }

  async getComments(issueId: string) {
    return this.prisma.issueComment.findMany({
      where: { issueId },
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
      orderBy: { createdAt: 'asc' },
    });
  }

  async getActivity(issueId: string) {
    return this.prisma.issueActivityLog.findMany({
      where: { issueId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async generateIssueNumber(projectId: string, projectKey: string): Promise<string> {
    const lastIssue = await this.prisma.issue.findFirst({
      where: { projectId },
      orderBy: { issueNumber: 'desc' },
      select: { issueNumber: true },
    });

    let nextNumber = 1;

    if (lastIssue) {
      const parts = lastIssue.issueNumber.split('-');
      if (parts.length === 2) {
        nextNumber = parseInt(parts[1], 10) + 1;
      }
    }

    return `${projectKey}-${nextNumber}`;
  }

  private async logActivity(
    issueId: string,
    userId: string,
    action: string,
    oldValue: any,
    newValue: any,
  ) {
    await this.prisma.issueActivityLog.create({
      data: {
        issueId,
        userId,
        action,
        oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
        newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
      },
    });
  }
}
