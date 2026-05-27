import { NextRequest } from 'next/server';
import prisma from '@/server/db';
import { getAuthUser } from '@/server/auth-handler';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/server/utils';

export async function GET(request: NextRequest, context: { params: Promise<{  projectId: string; id: string  }> }) {
  const params = await context.params;
  try {
    const auth = getAuthUser(request);
    if (!auth) return unauthorizedResponse();

    const versions = await prisma.documentVersion.findMany({
      where: { documentId: params.id },
      orderBy: { versionNumber: 'desc' },
    });

    return successResponse(versions);
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

    const maxVersion = await prisma.documentVersion.aggregate({
      where: { documentId: params.id },
      _max: { versionNumber: true },
    });

    const version = await prisma.documentVersion.create({
      data: {
        documentId: params.id,
        authorId: userId,
        content: body.content,
        changeSummary: body.changeSummary,
        versionNumber: (maxVersion._max.versionNumber || 0) + 1,
      },
    });

    return successResponse(version, 201);
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
