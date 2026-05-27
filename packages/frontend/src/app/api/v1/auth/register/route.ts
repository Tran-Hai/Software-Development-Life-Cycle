import { NextRequest } from 'next/server';
import prisma from '@/server/db';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, conflictResponse } from '@/server/utils';
import { signAccessToken, generateRefreshToken, hashPassword, verifyPassword } from '@/server/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName } = body;

    if (!email || !password || !fullName) {
      return errorResponse('Email, password, and fullName are required');
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return conflictResponse('Email already registered');
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: { email, passwordHash, fullName },
      select: { id: true, email: true, fullName: true, avatarUrl: true, createdAt: true },
    });

    const accessToken = signAccessToken(user.id, user.email, []);
    const refreshToken = generateRefreshToken();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await prisma.refreshToken.create({
      data: { userId: user.id, tokenHash: refreshToken, expiresAt },
    });

    return successResponse({ user, accessToken, refreshToken }, 201);
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
