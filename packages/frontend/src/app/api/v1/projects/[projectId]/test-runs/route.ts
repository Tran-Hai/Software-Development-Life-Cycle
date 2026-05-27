import { NextRequest } from 'next/server';
import prisma from '@/server/db';
import { getAuthUser } from '@/server/auth-handler';
import { successResponse, errorResponse, unauthorizedResponse } from '@/server/utils';

export async function GET(request: NextRequest, context: { params: Promise<{  projectId: string  }> }) {
  const params = await context.params;
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const suiteId = searchParams.get('suiteId');

    const runs = await prisma.testRun.findMany({
      where: {
        testSuite: { projectId: params.projectId },
        ...(suiteId && { testSuiteId: suiteId }),
      },
      include: {
        testSuite: { select: { id: true, name: true } },
        sprint: { select: { id: true, name: true } },
        executor: { select: { id: true, fullName: true, avatarUrl: true } },
        _count: { select: { results: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(runs);
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{  projectId: string  }> }) {
  const params = await context.params;
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const body = await request.json();
    if (!body.name || !body.testSuiteId) {
      return errorResponse('Name and testSuiteId are required', 400);
    }

    const testSuite = await prisma.testSuite.findUnique({ where: { id: body.testSuiteId } });
    if (!testSuite) return errorResponse('Test suite not found', 404);

    const testRun = await prisma.testRun.create({
      data: {
        testSuiteId: body.testSuiteId,
        sprintId: body.sprintId || null,
        executorId: authUser.sub,
        name: body.name,
        status: 'planned',
      },
      include: {
        executor: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });

    return successResponse(testRun, 201);
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
