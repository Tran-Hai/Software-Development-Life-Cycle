import { NextRequest } from 'next/server';
import prisma from '@/server/db';
import { getAuthUser } from '@/server/auth-handler';
import { successResponse, errorResponse, unauthorizedResponse } from '@/server/utils';

export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return errorResponse('refreshToken is required');
    }

    await prisma.refreshToken.deleteMany({
      where: { userId: user.sub, tokenHash: refreshToken },
    });

    return successResponse({ success: true });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
