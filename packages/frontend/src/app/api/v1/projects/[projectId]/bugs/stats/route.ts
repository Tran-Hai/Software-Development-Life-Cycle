import { NextRequest } from 'next/server';
import prisma from '@/server/db';
import { getAuthUser } from '@/server/auth-handler';
import { successResponse, errorResponse, unauthorizedResponse } from '@/server/utils';

export async function GET(request: NextRequest, context: { params: Promise<{  projectId: string  }> }) {
  const params = await context.params;
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const { projectId } = params;

    const [total, byStatus, bySeverity] = await Promise.all([
      prisma.bug.count({ where: { projectId } }),
      prisma.bug.groupBy({
        by: ['status'],
        where: { projectId },
        _count: true,
      }),
      prisma.bug.groupBy({
        by: ['severity'],
        where: { projectId },
        _count: true,
      }),
    ]);

    return successResponse({
      total,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
      bySeverity: bySeverity.reduce((acc, item) => {
        acc[item.severity] = item._count;
        return acc;
      }, {} as Record<string, number>),
    });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
