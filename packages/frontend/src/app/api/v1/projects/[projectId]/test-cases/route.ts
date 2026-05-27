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
    const testSuiteId = searchParams.get('testSuiteId');

    const cases = await prisma.testCase.findMany({
      where: {
        projectId: params.projectId,
        ...(testSuiteId && { testSuiteId }),
      },
      include: {
        testSuite: { select: { id: true, name: true } },
        author: { select: { id: true, fullName: true, avatarUrl: true } },
        _count: { select: { results: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(cases);
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
    if (!body.title || !body.testSuiteId) {
      return errorResponse('Title and testSuiteId are required', 400);
    }

    const testCase = await prisma.testCase.create({
      data: {
        projectId: params.projectId,
        testSuiteId: body.testSuiteId,
        authorId: authUser.sub,
        title: body.title,
        description: body.description,
        preconditions: body.preconditions,
        steps: body.steps,
        expectedResult: body.expectedResult,
        priority: body.priority || 'medium',
        status: body.status || 'draft',
      },
      include: { testSuite: { select: { id: true, name: true } } },
    });

    return successResponse(testCase, 201);
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
