import { NextRequest } from 'next/server';
import prisma from '@/server/db';
import { getAuthUser } from '@/server/auth-handler';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/server/utils';

export async function GET(request: NextRequest, context: { params: Promise<{  id: string  }> }) {
  const params = await context.params;
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const suite = await prisma.testSuite.findUnique({
      where: { id: params.id },
      include: {
        testCases: {
          include: {
            author: { select: { id: true, fullName: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { testCases: true, testRuns: true } },
      },
    });

    if (!suite) return notFoundResponse('Test suite not found');

    return successResponse(suite);
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{  id: string  }> }) {
  const params = await context.params;
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const existing = await prisma.testSuite.findUnique({ where: { id: params.id } });
    if (!existing) return notFoundResponse('Test suite not found');

    const body = await request.json();

    const updated = await prisma.testSuite.update({
      where: { id: params.id },
      data: body,
      include: {
        _count: { select: { testCases: true, testRuns: true } },
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

    const existing = await prisma.testSuite.findUnique({ where: { id: params.id } });
    if (!existing) return notFoundResponse('Test suite not found');

    await prisma.testSuite.delete({ where: { id: params.id } });

    return successResponse({ message: 'Test suite deleted' });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
