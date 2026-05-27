import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateEpicDto, UpdateEpicDto } from './dto/epic.dto';

@Injectable()
export class EpicsService {
  constructor(private prisma: PrismaService) {}

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

  async create(projectId: string, dto: CreateEpicDto) {
    return this.prisma.epic.create({
      data: {
        projectId,
        title: dto.title,
        description: dto.description,
        color: dto.color || '#3b82f6',
        status: dto.status || 'backlog',
      },
    });
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

  async delete(id: string) {
    const epic = await this.prisma.epic.findUnique({ where: { id } });
    if (!epic) {
      throw new NotFoundException('Epic not found');
    }

    // Unlink issues from epic before deleting
    await this.prisma.issue.updateMany({
      where: { epicId: id },
      data: { epicId: null },
    });

    return this.prisma.epic.delete({ where: { id } });
  }
}
