import { NextRequest } from 'next/server';
import prisma from '@/server/db';
import { getAuthUser } from '@/server/auth-handler';
import { successResponse, errorResponse, unauthorizedResponse } from '@/server/utils';

export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const notifications = await prisma.notification.findMany({
      where: { userId: authUser.sub },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return successResponse(notifications);
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
