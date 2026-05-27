import { NextRequest } from 'next/server';
import prisma from '@/server/db';
import { getAuthUser } from '@/server/auth-handler';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/server/utils';

export async function GET(request: NextRequest, context: { params: Promise<{  projectId: string; id: string  }> }) {
  const params = await context.params;
  try {
    const auth = getAuthUser(request);
    if (!auth) return unauthorizedResponse();

    const comments = await prisma.documentComment.findMany({
      where: { documentId: params.id },
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

    const document = await prisma.document.findUnique({ where: { id: params.id } });
    if (!document) return notFoundResponse('Document not found');

    const body = await request.json();
    if (!body.content) return errorResponse('Content is required', 400);

    const comment = await prisma.documentComment.create({
      data: {
        documentId: params.id,
        authorId: userId,
        content: body.content,
        parentId: body.parentId || null,
      },
    });

    if (document.authorId !== userId) {
      const actor = await prisma.user.findUnique({ where: { id: userId }, select: { fullName: true } });
      await prisma.notification.create({
        data: {
          userId: document.authorId,
          type: 'comment',
          title: `${actor?.fullName || 'Someone'} commented on "${document.title}"`,
          body: body.content?.slice(0, 100),
          entityType: 'document',
          entityId: params.id,
        },
      });
    }

    return successResponse(comment, 201);
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
