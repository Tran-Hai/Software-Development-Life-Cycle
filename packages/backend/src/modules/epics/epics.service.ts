import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateEpicDto, UpdateEpicDto } from './dto/epic.dto';

@Injectable()
export class EpicsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async findAll(projectId: string) {
    const epics = await this.prisma.epic.findMany({
      where: { projectId },
      include: {
        _count: {
          select: {
            issues: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate progress for each epic
    const epicsWithProgress = await Promise.all(
      epics.map(async (epic) => {
        const issues = await this.prisma.issue.findMany({
          where: { epicId: epic.id },
          select: { status: true, storyPoints: true },
        });

        const total = issues.length;
        const done = issues.filter((i) => i.status === 'done').length;
        const totalPoints = issues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
        const donePoints = issues
          .filter((i) => i.status === 'done')
          .reduce((sum, i) => sum + (i.storyPoints || 0), 0);

        return {
          ...epic,
          progress: total > 0 ? Math.round((done / total) * 100) : 0,
          totalIssues: total,
          doneIssues: done,
          totalPoints,
          donePoints,
        };
      }),
    );

    return epicsWithProgress;
  }

  async findOne(id: string) {
    const epic = await this.prisma.epic.findUnique({
      where: { id },
      include: {
        issues: {
          include: {
            issueType: true,
            assignee: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
        },
      },
    });

    if (!epic) {
      throw new NotFoundException('Epic not found');
    }

    const total = epic.issues.length;
    const done = epic.issues.filter((i) => i.status === 'done').length;

    return {
      ...epic,
      progress: total > 0 ? Math.round((done / total) * 100) : 0,
      totalIssues: total,
      doneIssues: done,
    };
  }

  async create(projectId: string, userId: string, dto: CreateEpicDto) {
    const epic = await this.prisma.epic.create({
      data: {
        projectId,
        title: dto.title,
        description: dto.description,
        color: dto.color || '#3b82f6',
        status: dto.status || 'backlog',
      },
    });

    const actor = await this.prisma.user.findUnique({ where: { id: userId }, select: { fullName: true } });
    await this.notifications.notifyProject(projectId, {
      type: 'epic',
      title: `${actor?.fullName || 'Someone'} created epic "${epic.title}"`,
      entityType: 'epic',
      entityId: epic.id,
    });

    return epic;
  }

  async update(id: string, dto: UpdateEpicDto) {
    const epic = await this.prisma.epic.findUnique({ where: { id } });
    if (!epic) {
      throw new NotFoundException('Epic not found');
    }

    return this.prisma.epic.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string, userId?: string) {
    const epic = await this.prisma.epic.findUnique({ where: { id } });
    if (!epic) {
      throw new NotFoundException('Epic not found');
    }

    await this.prisma.issue.updateMany({
      where: { epicId: id },
      data: { epicId: null },
    });

    if (userId) {
      const actor = await this.prisma.user.findUnique({ where: { id: userId }, select: { fullName: true } });
      const actorName = actor?.fullName || 'Someone';
      await this.notifications.notifyProject(epic.projectId, {
        type: 'epic',
        title: `${actorName} deleted epic "${epic.title}"`,
        entityType: 'epic',
        entityId: id,
      });
    }

    return this.prisma.epic.delete({ where: { id } });
  }
}
