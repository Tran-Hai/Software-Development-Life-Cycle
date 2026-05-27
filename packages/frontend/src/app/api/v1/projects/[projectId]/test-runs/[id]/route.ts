import { NextRequest } from 'next/server';
import prisma from '@/server/db';
import { getAuthUser } from '@/server/auth-handler';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/server/utils';

export async function GET(request: NextRequest, context: { params: Promise<{  id: string  }> }) {
  const params = await context.params;
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const testRun = await prisma.testRun.findUnique({
      where: { id: params.id },
      include: {
        testSuite: {
          include: {
            testCases: {
              include: {
                results: {
                  where: { testRunId: params.id },
                  include: {
                    executor: { select: { id: true, fullName: true, avatarUrl: true } },
                  },
                },
              },
            },
          },
        },
        executor: { select: { id: true, fullName: true, avatarUrl: true } },
        results: {
          include: {
            testCase: true,
            executor: { select: { id: true, fullName: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!testRun) return notFoundResponse('Test run not found');

    return successResponse(testRun);
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{  id: string  }> }) {
  const params = await context.params;
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const existing = await prisma.testRun.findUnique({ where: { id: params.id } });
    if (!existing) return notFoundResponse('Test run not found');

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.status) data.status = body.status;
    if (body.status === 'in_progress' && !existing.startedAt) data.startedAt = new Date();
    if (['passed', 'failed', 'blocked'].includes(body.status) && !existing.completedAt) {
      data.completedAt = new Date();
    }
    if (body.startedAt) data.startedAt = new Date(body.startedAt);
    if (body.completedAt) data.completedAt = new Date(body.completedAt);

    const updated = await prisma.testRun.update({
      where: { id: params.id },
      data,
    });

    return successResponse(updated);
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
