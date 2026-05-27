import { NextRequest } from 'next/server';
import prisma from '@/server/db';
import { successResponse, errorResponse, unauthorizedResponse } from '@/server/utils';
import { signAccessToken, generateRefreshToken } from '@/server/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return errorResponse('refreshToken is required');
    }

    const stored = await prisma.refreshToken.findFirst({
      where: { tokenHash: refreshToken },
    });

    if (!stored) {
      return unauthorizedResponse('Invalid refresh token');
    }

    if (stored.expiresAt < new Date()) {
      await prisma.refreshToken.delete({ where: { id: stored.id } });
      return unauthorizedResponse('Refresh token expired');
    }

    const user = await prisma.user.findUnique({
      where: { id: stored.userId },
      select: { id: true, email: true, userRoles: { include: { role: true } } },
    });

    if (!user) {
      return unauthorizedResponse('User not found');
    }

    await prisma.refreshToken.delete({ where: { id: stored.id } });

    const roles = user.userRoles.map((ur) => ur.role.name);
    const accessToken = signAccessToken(user.id, user.email, roles);
    const newRefreshToken = generateRefreshToken();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await prisma.refreshToken.create({
      data: { userId: user.id, tokenHash: newRefreshToken, expiresAt },
    });

    return successResponse({ accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
