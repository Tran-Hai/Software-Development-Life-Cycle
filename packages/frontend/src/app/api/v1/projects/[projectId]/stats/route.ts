import { NextRequest } from 'next/server';
import prisma from '@/server/db';
import { getAuthUser } from '@/server/auth-handler';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/server/utils';

export async function GET(request: NextRequest, context: { params: Promise<{  projectId: string  }> }) {
  const params = await context.params;
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const { projectId } = params;

    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } });
    if (!project) {
      return notFoundResponse('Project not found');
    }

    const isMember = await prisma.member.findFirst({
      where: { userId: authUser.sub, projectId },
    });

    if (!isMember) {
      return errorResponse('You are not a member of this project', 403);
    }

    const [issueCounts, bugCounts, activeSprint, memberCount] = await Promise.all([
      prisma.issue.groupBy({ by: ['status'], where: { projectId }, _count: true }),
      prisma.bug.groupBy({ by: ['status'], where: { projectId }, _count: true }),
      prisma.sprint.findFirst({ where: { projectId, status: 'active' }, select: { id: true, name: true } }),
      prisma.member.count({ where: { projectId } }),
    ]);

    const issuesByStatus = issueCounts.reduce((acc: Record<string, number>, item: { status: string; _count: number }) => {
      acc[item.status] = item._count;
      return acc;
    }, {});

    const bugsByStatus = bugCounts.reduce((acc: Record<string, number>, item: { status: string; _count: number }) => {
      acc[item.status] = item._count;
      return acc;
    }, {});

    return successResponse({
      issuesByStatus,
      bugsByStatus,
      activeSprint,
      memberCount,
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Failed to fetch project stats');
  }
}
