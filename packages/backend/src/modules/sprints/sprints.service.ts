import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateSprintDto, UpdateSprintDto, UpdateSprintStatusDto } from './dto/sprint.dto';

@Injectable()
export class SprintsService {
  constructor(private prisma: PrismaService) {}

  async findAll(projectId: string) {
    const sprints = await this.prisma.sprint.findMany({
      where: { projectId },
      include: {
        _count: {
          select: {
            issues: true,
          },
        },
      },
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
    });

    // Get issue status breakdown for each sprint
    const sprintsWithStats = await Promise.all(
      sprints.map(async (sprint) => {
        const issuesByStatus = await this.prisma.issue.groupBy({
          by: ['status'],
          where: { sprintId: sprint.id },
          _count: true,
        });

        const statusMap: Record<string, number> = {};
        issuesByStatus.forEach(({ status, _count }) => {
          statusMap[status] = _count;
        });

        return {
          ...sprint,
          issuesByStatus: statusMap,
        };
      }),
    );

    return sprintsWithStats;
  }

  async findOne(id: string) {
    const sprint = await this.prisma.sprint.findUnique({
      where: { id },
      include: {
        issues: {
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
            _count: {
              select: {
                comments: true,
                subtasks: true,
              },
            },
          },
          orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
        },
        _count: {
          select: {
            issues: true,
          },
        },
      },
    });

    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }

    return sprint;
  }

  async create(projectId: string, dto: CreateSprintDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const maxPosition = await this.prisma.sprint.aggregate({
      where: { projectId },
      _max: { position: true },
    });

    const position = (maxPosition._max.position || 0) + 1;

    return this.prisma.sprint.create({
      data: {
        projectId,
        name: dto.name,
        goal: dto.goal,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        status: dto.status || 'planning',
        position: dto.position || position,
      },
      include: {
        _count: {
          select: {
            issues: true,
          },
        },
      },
    });
  }

  async update(id: string, dto: UpdateSprintDto) {
    const existingSprint = await this.prisma.sprint.findUnique({
      where: { id },
    });

    if (!existingSprint) {
      throw new NotFoundException('Sprint not found');
    }

    return this.prisma.sprint.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
      include: {
        _count: {
          select: {
            issues: true,
          },
        },
      },
    });
  }

  async updateStatus(id: string, dto: UpdateSprintStatusDto) {
    const existingSprint = await this.prisma.sprint.findUnique({
      where: { id },
    });

    if (!existingSprint) {
      throw new NotFoundException('Sprint not found');
    }

    if (dto.status === 'active' && existingSprint.status !== 'planning') {
      const activeSprint = await this.prisma.sprint.findFirst({
        where: {
          projectId: existingSprint.projectId,
          status: 'active',
          id: { not: id },
        },
      });

      if (activeSprint) {
        throw new BadRequestException(
          'Another sprint is already active. Complete it first.',
        );
      }
    }

    return this.prisma.sprint.update({
      where: { id },
      data: { status: dto.status },
      include: {
        _count: {
          select: {
            issues: true,
          },
        },
      },
    });
  }

  async delete(id: string) {
    const sprint = await this.prisma.sprint.findUnique({
      where: { id },
    });

    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }

    const issueCount = await this.prisma.issue.count({
      where: { sprintId: id },
    });

    if (issueCount > 0) {
      throw new BadRequestException(
        'Cannot delete sprint with issues. Move or remove issues first.',
      );
    }

    return this.prisma.sprint.delete({
      where: { id },
    });
  }

  async getBurndownData(sprintId: string) {
    const sprint = await this.prisma.sprint.findUnique({
      where: { id: sprintId },
    });

    if (!sprint || !sprint.startDate || !sprint.endDate) {
      return { days: [], ideal: [], actual: [] };
    }

    const startDate = sprint.startDate;
    const endDate = sprint.endDate;
    const totalDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    const totalStoryPoints = await this.prisma.issue.aggregate({
      where: { sprintId },
      _sum: { storyPoints: true },
    });

    const totalPoints = totalStoryPoints._sum.storyPoints || 0;

    const ideal = Array.from({ length: totalDays + 1 }, (_, i) =>
      Math.round(((totalDays - i) / totalDays) * totalPoints),
    );

    const days = Array.from({ length: totalDays + 1 }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      return date.toISOString().split('T')[0];
    });

    const actual: number[] = [];

    for (let i = 0; i <= totalDays; i++) {
      const dayEnd = new Date(startDate);
      dayEnd.setDate(dayEnd.getDate() + i + 1);

      const completedPoints = await this.prisma.issue.aggregate({
        where: {
          sprintId,
          status: 'done',
          resolvedAt: { lt: dayEnd },
        },
        _sum: { storyPoints: true },
      });

      const completed = completedPoints._sum.storyPoints || 0;
      actual.push(totalPoints - completed);
    }

    return { days, ideal, actual };
  }
}
