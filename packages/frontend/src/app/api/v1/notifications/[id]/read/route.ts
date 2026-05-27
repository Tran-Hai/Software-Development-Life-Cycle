import { NextRequest } from 'next/server';
import prisma from '@/server/db';
import { getAuthUser } from '@/server/auth-handler';
import { successResponse, errorResponse, unauthorizedResponse } from '@/server/utils';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();
    const { id } = await params;

    await prisma.notification.updateMany({
      where: { id, userId: authUser.sub },
      data: { isRead: true },
    });

    return successResponse({ message: 'Notification marked as read' });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
