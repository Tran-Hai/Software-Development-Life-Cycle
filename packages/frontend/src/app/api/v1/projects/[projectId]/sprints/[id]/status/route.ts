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

    const sprint = await prisma.sprint.findUnique({ where: { id: params.id } });
    if (!sprint) return notFoundResponse('Sprint not found');

    const body = await request.json();
    if (!body.status) return errorResponse('Status is required', 400);

    if (body.status === 'active' && sprint.status !== 'planning') {
      const activeSprint = await prisma.sprint.findFirst({
        where: {
          projectId: params.projectId,
          status: 'active',
          id: { not: params.id },
        },
      });

      if (activeSprint) {
        return errorResponse('Another sprint is already active. Complete it first.', 400);
      }
    }

    const updated = await prisma.sprint.update({
      where: { id: params.id },
      data: { status: body.status },
      include: {
        _count: { select: { issues: true } },
      },
    });

    return successResponse(updated);
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
