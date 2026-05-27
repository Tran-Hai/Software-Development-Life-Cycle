import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('projects/:projectId/stats')
@UseGuards(JwtAuthGuard)
export class ProjectStatsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getStats(@Param('projectId') projectId: string) {
    const [
      totalIssues,
      issuesByStatus,
      issuesByPriority,
      totalStoryPoints,
      completedStoryPoints,
      totalSprints,
      activeSprints,
      totalMembers,
      totalBugs,
      openBugs,
      totalTestRuns,
      passedTestRuns,
    ] = await Promise.all([
      this.prisma.issue.count({ where: { projectId } }),
      this.prisma.issue.groupBy({
        by: ['status'],
        where: { projectId },
        _count: true,
      }),
      this.prisma.issue.groupBy({
        by: ['priority'],
        where: { projectId },
        _count: true,
      }),
      this.prisma.issue.aggregate({
        where: { projectId },
        _sum: { storyPoints: true },
      }),
      this.prisma.issue.aggregate({
        where: { projectId, status: 'done' },
        _sum: { storyPoints: true },
      }),
      this.prisma.sprint.count({ where: { projectId } }),
      this.prisma.sprint.count({ where: { projectId, status: 'active' } }),
      this.prisma.member.count({ where: { projectId } }),
      this.prisma.bug.count({ where: { projectId } }),
      this.prisma.bug.count({ where: { projectId, status: { in: ['open', 'in_progress'] } } }),
      this.prisma.testRun.count({ where: { testSuite: { projectId } } }),
      this.prisma.testRun.count({
        where: { testSuite: { projectId }, status: 'passed' },
      }),
    ]);

    const statusMap = issuesByStatus.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {} as Record<string, number>);

    const priorityMap = issuesByPriority.reduce((acc, item) => {
      acc[item.priority] = item._count;
      return acc;
    }, {} as Record<string, number>);

    // Recent activity
    const recentIssues = await this.prisma.issue.findMany({
      where: { projectId },
      take: 5,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        issueNumber: true,
        title: true,
        status: true,
        updatedAt: true,
        issueType: {
          select: { name: true, color: true },
        },
      },
    });

    return {
      totalIssues,
      issuesByStatus: statusMap,
      issuesByPriority: priorityMap,
      totalStoryPoints: totalStoryPoints._sum.storyPoints || 0,
      completedStoryPoints: completedStoryPoints._sum.storyPoints || 0,
      totalSprints,
      activeSprints,
      totalMembers,
      totalBugs,
      openBugs,
      totalTestRuns,
      passedTestRuns,
      recentIssues,
    };
  }
}
