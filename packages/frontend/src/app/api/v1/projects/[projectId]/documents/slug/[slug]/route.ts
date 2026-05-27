import { NextRequest } from 'next/server';
import prisma from '@/server/db';
import { getAuthUser } from '@/server/auth-handler';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/server/utils';

export async function GET(request: NextRequest, context: { params: Promise<{  projectId: string; slug: string  }> }) {
  const params = await context.params;
  try {
    const auth = getAuthUser(request);
    if (!auth) return unauthorizedResponse();

    const document = await prisma.document.findFirst({
      where: { projectId: params.projectId, slug: params.slug },
      include: {
        author: {
          select: { id: true, email: true, fullName: true, avatarUrl: true },
        },
        children: {
          include: {
            author: {
              select: { id: true, email: true, fullName: true, avatarUrl: true },
            },
          },
          orderBy: { position: 'asc' },
        },
        parent: {
          select: { id: true, title: true, slug: true },
        },
      },
    });

    if (!document) return notFoundResponse('Document not found');

    return successResponse(document);
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
