import { NextRequest } from 'next/server';
import prisma from '@/server/db';
import { Prisma } from '@prisma/client';
import { getAuthUser } from '@/server/auth-handler';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/server/utils';

export async function GET(request: NextRequest, context: { params: Promise<{  projectId: string  }> }) {
  const params = await context.params;
  try {
    const auth = getAuthUser(request);
    if (!auth) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const assigneeId = searchParams.get('assigneeId');
    const priority = searchParams.get('priority');

    const issues = await prisma.issue.findMany({
      where: {
        projectId: params.projectId,
        ...(status && { status }),
        ...(assigneeId && { assigneeId }),
        ...(priority && { priority }),
      },
      include: {
        issueType: true,
        assignee: {
          select: { id: true, email: true, fullName: true, avatarUrl: true },
        },
        reporter: {
          select: { id: true, email: true, fullName: true, avatarUrl: true },
        },
        sprint: {
          select: { id: true, name: true, status: true },
        },
        _count: {
          select: { comments: true, subtasks: true },
        },
      },
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
    });

    return successResponse(issues);
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

    const issueType = await prisma.issueType.findUnique({
      where: { id: (await request.json()).issueTypeId },
    });
    if (!issueType) return notFoundResponse('Issue type not found');

    const body = await request.json();

    const lastIssue = await prisma.issue.findFirst({
      where: { projectId: params.projectId },
      orderBy: { issueNumber: 'desc' },
      select: { issueNumber: true },
    });

    let nextNumber = 1;
    if (lastIssue) {
      const parts = lastIssue.issueNumber.split('-');
      if (parts.length === 2) {
        nextNumber = parseInt(parts[1], 10) + 1;
      }
    }
    const issueNumber = `${project.key}-${nextNumber}`;

    const issue = await prisma.issue.create({
      data: {
        projectId: params.projectId,
        issueNumber,
        issueTypeId: body.issueTypeId,
        epicId: body.epicId || null,
        sprintId: body.sprintId || null,
        assigneeId: body.assigneeId || null,
        reporterId: userId,
        parentId: body.parentId || null,
        title: body.title,
        description: body.description,
        status: body.status || 'backlog',
        priority: body.priority || 'medium',
        storyPoints: body.storyPoints || null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
      },
      include: {
        issueType: true,
        assignee: {
          select: { id: true, email: true, fullName: true, avatarUrl: true },
        },
      },
    });

    await prisma.issueActivityLog.create({
      data: {
        issueId: issue.id,
        userId,
        action: 'created',
        oldValue: Prisma.DbNull,
        newValue: { title: issue.title, status: issue.status },
      },
    });

    const actor = await prisma.user.findUnique({ where: { id: userId }, select: { fullName: true } });
    const actorName = actor?.fullName || 'Someone';

    if (body.assigneeId && body.assigneeId !== userId) {
      await prisma.notification.create({
        data: {
          userId: body.assigneeId,
          type: 'assignment',
          title: `${actorName} assigned you to ${issueNumber}`,
          body: issue.title,
          entityType: 'issue',
          entityId: issue.id,
        },
      });
    }

    return successResponse(issue, 201);
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
