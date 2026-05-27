import { NextRequest } from 'next/server';
import prisma from '@/server/db';
import { getAuthUser } from '@/server/auth-handler';
import { successResponse, unauthorizedResponse, notFoundResponse, errorResponse } from '@/server/utils';

export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return unauthorizedResponse();
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.sub },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        userRoles: { include: { role: true } },
      },
    });

    if (!user) {
      return notFoundResponse('User not found');
    }

    return successResponse(user);
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
