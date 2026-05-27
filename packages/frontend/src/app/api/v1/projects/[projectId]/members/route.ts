import { NextRequest } from 'next/server';
import prisma from '@/server/db';
import { getAuthUser } from '@/server/auth-handler';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, conflictResponse } from '@/server/utils';

export async function GET(request: NextRequest, context: { params: Promise<{  projectId: string  }> }) {
  const params = await context.params;
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const { projectId } = params;

    const members = await prisma.member.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return successResponse(members);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Failed to fetch members');
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{  projectId: string  }> }) {
  const params = await context.params;
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const { projectId } = params;

    const membership = await prisma.member.findFirst({
      where: { userId: authUser.sub, projectId },
      include: { role: true },
    });

    if (!membership || !['owner', 'admin'].includes(membership.role.name)) {
      return errorResponse('You do not have permission to manage members', 403);
    }

    const body = await request.json();
    const { userId: targetUserId, roleId, email } = body;

    let resolvedUserId = targetUserId;

    if (email) {
      const invitedUser = await prisma.user.findUnique({
        where: { email },
      });

      if (!invitedUser) {
        return notFoundResponse('No user found with this email');
      }

      resolvedUserId = invitedUser.id;
    }

    if (!resolvedUserId) {
      return errorResponse('Either userId or email is required');
    }

    const existingMember = await prisma.member.findUnique({
      where: {
        userId_projectId: {
          userId: resolvedUserId,
          projectId,
        },
      },
    });

    if (existingMember) {
      return conflictResponse('User is already a member of this project');
    }

    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role || role.scope !== 'project') {
      return notFoundResponse('Invalid role');
    }

    const member = await prisma.member.create({
      data: {
        userId: resolvedUserId,
        projectId,
        roleId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    return successResponse(member, 201);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Failed to add member');
  }
}
