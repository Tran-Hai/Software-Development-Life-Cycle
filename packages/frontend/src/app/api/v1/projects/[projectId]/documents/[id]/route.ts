import { NextRequest } from 'next/server';
import prisma from '@/server/db';
import { getAuthUser } from '@/server/auth-handler';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/server/utils';

export async function PATCH(request: NextRequest, context: { params: Promise<{  projectId: string; id: string  }> }) {
  const params = await context.params;
  try {
    const auth = getAuthUser(request);
    if (!auth) return unauthorizedResponse();
    const userId = auth.sub;

    const existing = await prisma.document.findUnique({ where: { id: params.id } });
    if (!existing) return notFoundResponse('Document not found');

    const body = await request.json();

    const shouldCreateVersion =
      body.content !== undefined && body.content !== existing.content;

    const updatedDoc = await prisma.document.update({
      where: { id: params.id },
      data: {
        ...body,
        publishedAt:
          body.status === 'published' && existing.status !== 'published'
            ? new Date()
            : undefined,
      },
      include: {
        author: {
          select: { id: true, email: true, fullName: true, avatarUrl: true },
        },
      },
    });

    if (shouldCreateVersion) {
      const maxVersion = await prisma.documentVersion.aggregate({
        where: { documentId: params.id },
        _max: { versionNumber: true },
      });

      await prisma.documentVersion.create({
        data: {
          documentId: params.id,
          authorId: userId,
          content: existing.content || '',
          versionNumber: (maxVersion._max.versionNumber || 0) + 1,
        },
      });
    }

    return successResponse(updatedDoc);
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{  projectId: string; id: string  }> }) {
  const params = await context.params;
  try {
    const auth = getAuthUser(request);
    if (!auth) return unauthorizedResponse();

    const existing = await prisma.document.findUnique({ where: { id: params.id } });
    if (!existing) return notFoundResponse('Document not found');

    await prisma.document.delete({ where: { id: params.id } });

    return successResponse(existing);
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
