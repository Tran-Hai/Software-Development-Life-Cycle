import { NextRequest } from 'next/server';
import prisma from '@/server/db';
import { getAuthUser } from '@/server/auth-handler';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/server/utils';

export async function GET(request: NextRequest, context: { params: Promise<{  projectId: string; id: string  }> }) {
  const params = await context.params;
  try {
    const auth = getAuthUser(request);
    if (!auth) return unauthorizedResponse();

    const issue = await prisma.issue.findUnique({
      where: { id: params.id },
      include: {
        issueType: true,
        assignee: {
          select: { id: true, email: true, fullName: true, avatarUrl: true },
        },
        reporter: {
          select: { id: true, email: true, fullName: true, avatarUrl: true },
        },
        sprint: true,
        epic: true,
        parent: true,
        subtasks: {
          include: {
            issueType: true,
            assignee: {
              select: { id: true, email: true, fullName: true, avatarUrl: true },
            },
          },
        },
        tags: {
          include: { tag: true },
        },
        _count: {
          select: { comments: true, attachments: true },
        },
      },
    });

    if (!issue) return notFoundResponse('Issue not found');

    return successResponse(issue);
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{  projectId: string; id: string  }> }) {
  const params = await context.params;
  try {
    const auth = getAuthUser(request);
    if (!auth) return unauthorizedResponse();
    const userId = auth.sub;

    const existing = await prisma.issue.findUnique({ where: { id: params.id } });
    if (!existing) return notFoundResponse('Issue not found');

    const body = await request.json();

    const oldValues: Record<string, any> = {};
    const newValues: Record<string, any> = {};

    if (body.status && body.status !== existing.status) {
      oldValues.status = existing.status;
      newValues.status = body.status;
    }
    if (body.assigneeId && body.assigneeId !== existing.assigneeId) {
      oldValues.assigneeId = existing.assigneeId;
      newValues.assigneeId = body.assigneeId;
    }
    if (body.priority && body.priority !== existing.priority) {
      oldValues.priority = existing.priority;
      newValues.priority = body.priority;
    }

    const resolvedAt =
      body.status === 'done' && existing.status !== 'done'
        ? new Date()
        : body.status !== 'done'
          ? null
          : undefined;

    const issue = await prisma.issue.update({
      where: { id: params.id },
      data: {
        ...body,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        resolvedAt,
      },
      include: {
        issueType: true,
        assignee: {
          select: { id: true, email: true, fullName: true, avatarUrl: true },
        },
      },
    });

    if (Object.keys(oldValues).length > 0) {
      await prisma.issueActivityLog.create({
        data: {
          issueId: params.id,
          userId,
          action: 'updated',
          oldValue: oldValues,
          newValue: newValues,
        },
      });
    }

    const actor = await prisma.user.findUnique({ where: { id: userId }, select: { fullName: true } });
    const actorName = actor?.fullName || 'Someone';

    if (body.assigneeId && body.assigneeId !== existing.assigneeId && body.assigneeId !== userId) {
      await prisma.notification.create({
        data: {
          userId: body.assigneeId,
          type: 'assignment',
          title: `${actorName} assigned you to ${existing.issueNumber}`,
          body: existing.title,
          entityType: 'issue',
          entityId: params.id,
        },
      });
    }

    if (body.status && body.status !== existing.status) {
      if (existing.assigneeId && existing.assigneeId !== userId) {
        await prisma.notification.create({
          data: {
            userId: existing.assigneeId,
            type: 'status_change',
            title: `${actorName} changed ${existing.issueNumber} to ${body.status}`,
            entityType: 'issue',
            entityId: params.id,
          },
        });
      }
    }

    return successResponse(issue);
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

    const existing = await prisma.issue.findUnique({ where: { id: params.id } });
    if (!existing) return notFoundResponse('Issue not found');

    const actor = await prisma.user.findUnique({ where: { id: userId }, select: { fullName: true } });
    const actorName = actor?.fullName || 'Someone';

    const notifyUsers = new Set<string>();
    if (existing.assigneeId && existing.assigneeId !== userId) notifyUsers.add(existing.assigneeId);
    if (existing.reporterId && existing.reporterId !== userId) notifyUsers.add(existing.reporterId);

    for (const targetId of notifyUsers) {
      await prisma.notification.create({
        data: {
          userId: targetId,
          type: 'issue',
          title: `${actorName} deleted ${existing.issueNumber}`,
          body: existing.title,
          entityType: 'issue',
          entityId: params.id,
        },
      });
    }

    await prisma.issue.delete({ where: { id: params.id } });

    return successResponse(existing);
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
