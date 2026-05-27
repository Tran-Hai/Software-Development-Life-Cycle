import { NextRequest } from 'next/server';
import prisma from '@/server/db';
import { getAuthUser } from '@/server/auth-handler';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/server/utils';

export async function GET(request: NextRequest, context: { params: Promise<{  projectId: string; id: string  }> }) {
  const params = await context.params;
  try {
    const auth = getAuthUser(request);
    if (!auth) return unauthorizedResponse();

    const sprint = await prisma.sprint.findUnique({ where: { id: params.id } });
    if (!sprint || !sprint.startDate || !sprint.endDate) {
      return successResponse({ totalPoints: 0, days: [] });
    }

    const startDate = sprint.startDate;
    const endDate = sprint.endDate;
    const today = new Date();

    const totalResult = await prisma.issue.aggregate({
      where: { sprintId: params.id },
      _sum: { storyPoints: true },
    });
    const totalPoints = totalResult._sum.storyPoints || 0;

    const days: { date: string; remainingPoints: number }[] = [];
    const current = new Date(startDate);

    while (current <= endDate && current <= today) {
      const dayEnd = new Date(current);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const completedResult = await prisma.issue.aggregate({
        where: {
          sprintId: params.id,
          status: 'done',
          resolvedAt: { lt: dayEnd },
        },
        _sum: { storyPoints: true },
      });
      const completed = completedResult._sum.storyPoints || 0;

      days.push({
        date: current.toISOString().split('T')[0],
        remainingPoints: totalPoints - completed,
      });

      current.setDate(current.getDate() + 1);
    }

    return successResponse({ totalPoints, days });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
