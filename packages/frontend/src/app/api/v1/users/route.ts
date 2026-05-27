import { NextRequest } from 'next/server';
import prisma from '@/server/db';
import { getAuthUser } from '@/server/auth-handler';
import { successResponse, unauthorizedResponse, errorResponse } from '@/server/utils';

export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return unauthorizedResponse();
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        isActive: true,
      },
    });

    return successResponse(users);
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
