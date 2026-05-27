import { NextRequest } from 'next/server';
import prisma from '@/server/db';
import { getAuthUser } from '@/server/auth-handler';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/server/utils';

export async function GET(request: NextRequest, context: { params: Promise<{  id: string  }> }) {
  const params = await context.params;
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const testCase = await prisma.testCase.findUnique({
      where: { id: params.id },
      include: {
        testSuite: true,
        author: { select: { id: true, fullName: true, avatarUrl: true } },
        results: {
          include: {
            testRun: { select: { id: true, name: true, status: true } },
            executor: { select: { id: true, fullName: true, avatarUrl: true } },
          },
          orderBy: { executedAt: 'desc' },
        },
      },
    });

    if (!testCase) return notFoundResponse('Test case not found');

    return successResponse(testCase);
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{  id: string  }> }) {
  const params = await context.params;
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const existing = await prisma.testCase.findUnique({ where: { id: params.id } });
    if (!existing) return notFoundResponse('Test case not found');

    const body = await request.json();
    const updated = await prisma.testCase.update({
      where: { id: params.id },
      data: body,
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

    const existing = await prisma.testCase.findUnique({ where: { id: params.id } });
    if (!existing) return notFoundResponse('Test case not found');

    await prisma.testCase.delete({ where: { id: params.id } });

    return successResponse({ message: 'Test case deleted' });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
