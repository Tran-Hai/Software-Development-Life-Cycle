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
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const assigneeId = searchParams.get('assigneeId');

    const bugs = await prisma.bug.findMany({
      where: {
        projectId,
        ...(status && { status }),
        ...(severity && { severity }),
        ...(assigneeId && { assigneeId }),
      },
      include: {
        reporter: { select: { id: true, fullName: true, avatarUrl: true } },
        assignee: { select: { id: true, fullName: true, avatarUrl: true } },
        issue: { select: { id: true, issueNumber: true, title: true } },
        testResult: {
          select: {
            id: true,
            status: true,
            testRun: { select: { id: true, name: true } },
          },
        },
        _count: { select: { attachments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(bugs);
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{  projectId: string  }> }) {
  const params = await context.params;
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const { projectId } = params;
    const body = await request.json();
    const {
      title,
      description,
      stepsToReproduce,
      severity,
      status,
      environment,
      issueId,
      assigneeId,
    } = body;

    if (!title) return errorResponse('Title is required', 400);

    const bug = await prisma.bug.create({
      data: {
        projectId,
        reporterId: authUser.sub,
        title,
        description,
        stepsToReproduce,
        severity: severity || 'medium',
        status: status || 'open',
        environment,
        issueId: issueId || null,
        assigneeId: assigneeId || null,
      },
      include: {
        reporter: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: authUser.sub,
        projectId,
        entityType: 'bug',
        entityId: bug.id,
        action: 'created',
        details: { title: bug.title },
      },
    });

    return successResponse(bug, 201);
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
