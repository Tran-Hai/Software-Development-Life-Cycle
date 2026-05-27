import { NextRequest } from 'next/server';
import prisma from '@/server/db';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, conflictResponse } from '@/server/utils';
import { signAccessToken, generateRefreshToken, hashPassword, verifyPassword } from '@/server/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return errorResponse('Email and password are required');
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return unauthorizedResponse('Invalid credentials');
    }

    const isValid = await verifyPassword(user.passwordHash, password);
    if (!isValid) {
      return unauthorizedResponse('Invalid credentials');
    }

    if (!user.isActive) {
      return unauthorizedResponse('Account is deactivated');
    }

    const accessToken = signAccessToken(user.id, user.email, []);
    const refreshToken = generateRefreshToken();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await prisma.refreshToken.create({
      data: { userId: user.id, tokenHash: refreshToken, expiresAt },
    });

    return successResponse({
      user: { id: user.id, email: user.email, fullName: user.fullName, avatarUrl: user.avatarUrl },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
