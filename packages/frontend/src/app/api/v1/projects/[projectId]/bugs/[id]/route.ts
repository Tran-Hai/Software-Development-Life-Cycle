import { NextRequest } from 'next/server';
import prisma from '@/server/db';
import { getAuthUser } from '@/server/auth-handler';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/server/utils';

export async function GET(request: NextRequest, context: { params: Promise<{  id: string  }> }) {
  const params = await context.params;
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const bug = await prisma.bug.findUnique({
      where: { id: params.id },
      include: {
        reporter: { select: { id: true, fullName: true, avatarUrl: true } },
        assignee: { select: { id: true, fullName: true, avatarUrl: true } },
        issue: { select: { id: true, issueNumber: true, title: true, status: true } },
        testResult: {
          include: {
            testCase: { select: { id: true, title: true } },
            testRun: { select: { id: true, name: true } },
          },
        },
        attachments: {
          include: {
            uploader: { select: { id: true, fullName: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!bug) return notFoundResponse('Bug not found');

    return successResponse(bug);
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{  id: string  }> }) {
  const params = await context.params;
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const existing = await prisma.bug.findUnique({ where: { id: params.id } });
    if (!existing) return notFoundResponse('Bug not found');

    const body = await request.json();

    const resolvedAt =
      body.status === 'fixed' && existing.status !== 'fixed'
        ? new Date()
        : body.status && body.status !== 'fixed'
          ? null
          : undefined;

    const updated = await prisma.bug.update({
      where: { id: params.id },
      data: { ...body, ...(resolvedAt !== undefined ? { resolvedAt } : {}) },
    });

    await prisma.activityLog.create({
      data: {
        userId: authUser.sub,
        projectId: existing.projectId,
        entityType: 'bug',
        entityId: params.id,
        action: 'updated',
        details: body,
      },
    });

    return successResponse(updated);
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{  id: string  }> }) {
  const params = await context.params;
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const existing = await prisma.bug.findUnique({ where: { id: params.id } });
    if (!existing) return notFoundResponse('Bug not found');

    await prisma.bug.delete({ where: { id: params.id } });

    await prisma.activityLog.create({
      data: {
        userId: authUser.sub,
        projectId: existing.projectId,
        entityType: 'bug',
        entityId: params.id,
        action: 'deleted',
        details: { title: existing.title },
      },
    });

    return successResponse({ message: 'Bug deleted' });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
