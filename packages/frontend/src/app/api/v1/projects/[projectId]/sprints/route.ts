import { NextRequest } from 'next/server';
import prisma from '@/server/db';
import { getAuthUser } from '@/server/auth-handler';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/server/utils';

export async function GET(request: NextRequest, context: { params: Promise<{  projectId: string  }> }) {
  const params = await context.params;
  try {
    const auth = getAuthUser(request);
    if (!auth) return unauthorizedResponse();

    const sprints = await prisma.sprint.findMany({
      where: { projectId: params.projectId },
      include: {
        _count: { select: { issues: true } },
      },
      orderBy: { position: 'asc' },
    });

    const sprintsWithStats = await Promise.all(
      sprints.map(async (sprint) => {
        const issuesByStatus = await prisma.issue.groupBy({
          by: ['status'],
          where: { sprintId: sprint.id },
          _count: true,
        });

        const statusMap: Record<string, number> = {};
        issuesByStatus.forEach(({ status, _count }) => {
          statusMap[status] = _count;
        });

        return { ...sprint, issuesByStatus: statusMap };
      }),
    );

    return successResponse(sprintsWithStats);
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{  projectId: string  }> }) {
  const params = await context.params;
  try {
    const auth = getAuthUser(request);
    if (!auth) return unauthorizedResponse();
    const userId = auth.sub;

    const project = await prisma.project.findUnique({ where: { id: params.projectId } });
    if (!project) return notFoundResponse('Project not found');

    const body = await request.json();
    if (!body.name) return errorResponse('Name is required', 400);

    const maxPosition = await prisma.sprint.aggregate({
      where: { projectId: params.projectId },
      _max: { position: true },
    });

    const position = (maxPosition._max.position || 0) + 1;

    const sprint = await prisma.sprint.create({
      data: {
        projectId: params.projectId,
        name: body.name,
        goal: body.goal,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        status: body.status || 'planning',
        position: body.position || position,
      },
      include: {
        _count: { select: { issues: true } },
      },
    });

    return successResponse(sprint, 201);
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
