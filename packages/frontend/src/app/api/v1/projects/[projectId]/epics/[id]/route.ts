import { NextRequest } from 'next/server';
import prisma from '@/server/db';
import { getAuthUser } from '@/server/auth-handler';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/server/utils';

export async function GET(request: NextRequest, context: { params: Promise<{  projectId: string; id: string  }> }) {
  const params = await context.params;
  try {
    const auth = getAuthUser(request);
    if (!auth) return unauthorizedResponse();

    const epic = await prisma.epic.findUnique({
      where: { id: params.id },
      include: {
        issues: {
          include: {
            issueType: true,
            assignee: {
              select: { id: true, fullName: true, avatarUrl: true },
            },
          },
          orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
        },
      },
    });

    if (!epic) return notFoundResponse('Epic not found');

    const total = epic.issues.length;
    const done = epic.issues.filter((i) => i.status === 'done').length;

    return successResponse({
      ...epic,
      progress: total > 0 ? Math.round((done / total) * 100) : 0,
      totalIssues: total,
      doneIssues: done,
    });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{  projectId: string; id: string  }> }) {
  const params = await context.params;
  try {
    const auth = getAuthUser(request);
    if (!auth) return unauthorizedResponse();

    const existing = await prisma.epic.findUnique({ where: { id: params.id } });
    if (!existing) return notFoundResponse('Epic not found');

    const body = await request.json();

    const epic = await prisma.epic.update({
      where: { id: params.id },
      data: body,
    });

    return successResponse(epic);
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

    const epic = await prisma.epic.findUnique({ where: { id: params.id } });
    if (!epic) return notFoundResponse('Epic not found');

    await prisma.issue.updateMany({
      where: { epicId: params.id },
      data: { epicId: null },
    });

    await prisma.epic.delete({ where: { id: params.id } });

    return successResponse(epic);
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
