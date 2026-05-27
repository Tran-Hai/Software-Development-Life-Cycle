import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateBugDto, UpdateBugDto } from './dto/bug.dto';

@Injectable()
export class BugsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async findAll(projectId: string, filters?: { status?: string; severity?: string; assigneeId?: string }) {
    return this.prisma.bug.findMany({
      where: {
        projectId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.severity && { severity: filters.severity }),
        ...(filters?.assigneeId && { assigneeId: filters.assigneeId }),
      },
      include: {
        reporter: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        assignee: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        issue: {
          select: {
            id: true,
            issueNumber: true,
            title: true,
          },
        },
        testResult: {
          select: {
            id: true,
            status: true,
            testRun: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            attachments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const bug = await this.prisma.bug.findUnique({
      where: { id },
      include: {
        reporter: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        assignee: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        issue: {
          select: {
            id: true,
            issueNumber: true,
            title: true,
            status: true,
          },
        },
        testResult: {
          include: {
            testCase: {
              select: {
                id: true,
                title: true,
              },
            },
            testRun: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        attachments: {
          include: {
            uploader: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!bug) {
      throw new NotFoundException('Bug not found');
    }

    return bug;
  }

  async create(projectId: string, reporterId: string, dto: CreateBugDto) {
    const bug = await this.prisma.bug.create({
      data: {
        projectId,
        reporterId,
        title: dto.title,
        description: dto.description,
        stepsToReproduce: dto.stepsToReproduce,
        severity: dto.severity || 'medium',
        status: dto.status || 'open',
        environment: dto.environment,
        testResultId: dto.testResultId || null,
        issueId: dto.issueId || null,
        assigneeId: dto.assigneeId || null,
      },
      include: {
        reporter: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    const actor = await this.prisma.user.findUnique({ where: { id: reporterId }, select: { fullName: true } });
    const actorName = actor?.fullName || 'Someone';

    if (dto.assigneeId && dto.assigneeId !== reporterId) {
      await this.notifications.notify({
        userId: dto.assigneeId,
        type: 'assignment',
        title: `${actorName} assigned bug to you`,
        body: bug.title,
        entityType: 'bug',
        entityId: bug.id,
      });
    }

    return bug;
  }

  async update(id: string, dto: UpdateBugDto, userId?: string) {
    const bug = await this.prisma.bug.findUnique({ where: { id } });
    if (!bug) {
      throw new NotFoundException('Bug not found');
    }

    const resolvedAt =
      dto.status === 'fixed' && bug.status !== 'fixed'
        ? new Date()
        : dto.status !== 'fixed'
          ? null
          : undefined;

    const updated = await this.prisma.bug.update({
      where: { id },
      data: {
        ...dto,
        resolvedAt,
      },
    });

    if (userId) {
      const actor = await this.prisma.user.findUnique({ where: { id: userId }, select: { fullName: true } });
      const actorName = actor?.fullName || 'Someone';

      if (dto.assigneeId && dto.assigneeId !== bug.assigneeId && dto.assigneeId !== userId) {
        await this.notifications.notify({
          userId: dto.assigneeId,
          type: 'assignment',
          title: `${actorName} assigned bug to you`,
          body: bug.title,
          entityType: 'bug',
          entityId: id,
        });
      }

      if (dto.status && dto.status !== bug.status && bug.assigneeId && bug.assigneeId !== userId) {
        await this.notifications.notify({
          userId: bug.assigneeId,
          type: 'status_change',
          title: `${actorName} changed bug status to ${dto.status}`,
          body: bug.title,
          entityType: 'bug',
          entityId: id,
        });
      }
    }

    return updated;
  }

  async delete(id: string) {
    const bug = await this.prisma.bug.findUnique({ where: { id } });
    if (!bug) {
      throw new NotFoundException('Bug not found');
    }

    return this.prisma.bug.delete({ where: { id } });
  }

  async getStats(projectId: string) {
    const [total, byStatus, bySeverity] = await Promise.all([
      this.prisma.bug.count({ where: { projectId } }),
      this.prisma.bug.groupBy({
        by: ['status'],
        where: { projectId },
        _count: true,
      }),
      this.prisma.bug.groupBy({
        by: ['severity'],
        where: { projectId },
        _count: true,
      }),
    ]);

    return {
      total,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
      bySeverity: bySeverity.reduce((acc, item) => {
        acc[item.severity] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}
