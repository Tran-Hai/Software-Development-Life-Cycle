import { NextRequest } from 'next/server';
import prisma from '@/server/db';
import { getAuthUser } from '@/server/auth-handler';
import { successResponse, errorResponse, unauthorizedResponse } from '@/server/utils';

export async function GET(request: NextRequest, context: { params: Promise<{  projectId: string  }> }) {
  const params = await context.params;
  try {
    const auth = getAuthUser(request);
    if (!auth) return unauthorizedResponse();

    const epics = await prisma.epic.findMany({
      where: { projectId: params.projectId },
      include: {
        _count: { select: { issues: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const epicsWithProgress = await Promise.all(
      epics.map(async (epic) => {
        const issues = await prisma.issue.findMany({
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

    return successResponse(epicsWithProgress);
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

    const body = await request.json();
    if (!body.title) return errorResponse('Title is required', 400);

    const epic = await prisma.epic.create({
      data: {
        projectId: params.projectId,
        title: body.title,
        description: body.description,
        color: body.color || '#3b82f6',
        status: body.status || 'backlog',
      },
    });

    return successResponse(epic, 201);
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
