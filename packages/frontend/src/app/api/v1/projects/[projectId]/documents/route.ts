import { NextRequest } from 'next/server';
import prisma from '@/server/db';
import { getAuthUser } from '@/server/auth-handler';
import { successResponse, errorResponse, unauthorizedResponse } from '@/server/utils';

export async function GET(request: NextRequest, context: { params: Promise<{  projectId: string  }> }) {
  const params = await context.params;
  try {
    const auth = getAuthUser(request);
    if (!auth) return unauthorizedResponse();

    const documents = await prisma.document.findMany({
      where: { projectId: params.projectId, parentId: null },
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
      },
      orderBy: { position: 'asc' },
    });

    return successResponse(documents);
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

    const body = await request.json();
    if (!body.title) return errorResponse('Title is required', 400);

    let slug = body.slug;
    if (!slug) {
      slug = body.title
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
    }

    const existingDoc = await prisma.document.findFirst({
      where: { projectId: params.projectId, slug },
    });

    if (existingDoc) {
      slug = `${slug}-${Date.now()}`;
    }

    const document = await prisma.document.create({
      data: {
        projectId: params.projectId,
        authorId: userId,
        title: body.title,
        content: body.content,
        slug,
        parentId: body.parentId || null,
        position: body.position || 0,
        status: body.status || 'draft',
      },
      include: {
        author: {
          select: { id: true, email: true, fullName: true, avatarUrl: true },
        },
      },
    });

    return successResponse(document, 201);
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
