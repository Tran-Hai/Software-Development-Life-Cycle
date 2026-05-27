import { NextRequest } from 'next/server';
import prisma from '@/server/db';
import { getAuthUser } from '@/server/auth-handler';
import { successResponse, errorResponse, unauthorizedResponse } from '@/server/utils';

export async function GET(request: NextRequest, context: { params: Promise<{  projectId: string  }> }) {
  const params = await context.params;
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const suites = await prisma.testSuite.findMany({
      where: { projectId: params.projectId },
      include: {
        _count: { select: { testCases: true, testRuns: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(suites);
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
    if (!body.name) return errorResponse('Name is required', 400);

    const suite = await prisma.testSuite.create({
      data: {
        projectId: params.projectId,
        name: body.name,
        description: body.description,
      },
      include: {
        _count: { select: { testCases: true, testRuns: true } },
      },
    });

    return successResponse(suite, 201);
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
