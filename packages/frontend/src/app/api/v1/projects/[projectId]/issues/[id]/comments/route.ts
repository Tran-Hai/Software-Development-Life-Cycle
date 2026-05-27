import { NextRequest } from 'next/server';
import prisma from '@/server/db';
import { Prisma } from '@prisma/client';
import { getAuthUser } from '@/server/auth-handler';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/server/utils';

export async function GET(request: NextRequest, context: { params: Promise<{  projectId: string; id: string  }> }) {
  const params = await context.params;
  try {
    const auth = getAuthUser(request);
    if (!auth) return unauthorizedResponse();

    const comments = await prisma.issueComment.findMany({
      where: { issueId: params.id },
      include: {
        author: {
          select: { id: true, email: true, fullName: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return successResponse(comments);
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{  projectId: string; id: string  }> }) {
  const params = await context.params;
  try {
    const auth = getAuthUser(request);
    if (!auth) return unauthorizedResponse();
    const userId = auth.sub;

    const issue = await prisma.issue.findUnique({ where: { id: params.id } });
    if (!issue) return notFoundResponse('Issue not found');

    const body = await request.json();
    if (!body.content) return errorResponse('Content is required', 400);

    const comment = await prisma.issueComment.create({
      data: {
        issueId: params.id,
        authorId: userId,
        content: body.content,
        parentId: body.parentId || null,
      },
      include: {
        author: {
          select: { id: true, email: true, fullName: true, avatarUrl: true },
        },
      },
    });

    await prisma.issueActivityLog.create({
      data: {
        issueId: params.id,
        userId,
        action: 'commented',
        oldValue: Prisma.DbNull,
        newValue: { commentId: comment.id },
      },
    });

    const actor = await prisma.user.findUnique({ where: { id: userId }, select: { fullName: true } });
    const actorName = actor?.fullName || 'Someone';

    const notifyUsers = new Set<string>();
    if (issue.assigneeId && issue.assigneeId !== userId) notifyUsers.add(issue.assigneeId);
    if (issue.reporterId && issue.reporterId !== userId) notifyUsers.add(issue.reporterId);

    for (const targetId of notifyUsers) {
      await prisma.notification.create({
        data: {
          userId: targetId,
          type: 'comment',
          title: `${actorName} commented on ${issue.issueNumber}`,
          body: body.content?.slice(0, 100),
          entityType: 'issue',
          entityId: params.id,
        },
      });
    }

    return successResponse(comment, 201);
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
