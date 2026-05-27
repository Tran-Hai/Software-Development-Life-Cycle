import { NextRequest } from 'next/server';
import prisma from '@/server/db';
import { getAuthUser } from '@/server/auth-handler';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/server/utils';

export async function GET(request: NextRequest, context: { params: Promise<{  projectId: string; id: string  }> }) {
  const params = await context.params;
  try {
    const auth = getAuthUser(request);
    if (!auth) return unauthorizedResponse();

    const sprint = await prisma.sprint.findUnique({
      where: { id: params.id },
      include: {
        issues: {
          include: {
            issueType: true,
            assignee: {
              select: { id: true, email: true, fullName: true, avatarUrl: true },
            },
            reporter: {
              select: { id: true, email: true, fullName: true, avatarUrl: true },
            },
            _count: { select: { comments: true, subtasks: true } },
          },
          orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
        },
        _count: { select: { issues: true } },
      },
    });

    if (!sprint) return notFoundResponse('Sprint not found');

    return successResponse(sprint);
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{  projectId: string; id: string  }> }) {
  const params = await context.params;
  try {
    const auth = getAuthUser(request);
    if (!auth) return unauthorizedResponse();

    const existing = await prisma.sprint.findUnique({ where: { id: params.id } });
    if (!existing) return notFoundResponse('Sprint not found');

    const body = await request.json();

    const sprint = await prisma.sprint.update({
      where: { id: params.id },
      data: {
        ...body,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
      },
      include: {
        _count: { select: { issues: true } },
      },
    });

    return successResponse(sprint);
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{  projectId: string; id: string  }> }) {
  const params = await context.params;
  try {
    const auth = getAuthUser(request);
    if (!auth) return unauthorizedResponse();
    const userId = auth.sub;

    const sprint = await prisma.sprint.findUnique({ where: { id: params.id } });
    if (!sprint) return notFoundResponse('Sprint not found');

    const issueCount = await prisma.issue.count({ where: { sprintId: params.id } });
    if (issueCount > 0) {
      return errorResponse('Cannot delete sprint with issues. Move or remove issues first.', 400);
    }

    await prisma.sprint.delete({ where: { id: params.id } });

    return successResponse(sprint);
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
