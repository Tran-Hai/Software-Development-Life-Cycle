import { NextRequest } from 'next/server';
import prisma from '@/server/db';
import { getAuthUser } from '@/server/auth-handler';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/server/utils';

export async function PATCH(request: NextRequest, context: { params: Promise<{  projectId: string; memberId: string  }> }) {
  const params = await context.params;
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const { projectId, memberId } = params;

    const membership = await prisma.member.findFirst({
      where: { userId: authUser.sub, projectId },
      include: { role: true },
    });

    if (!membership || !['owner', 'admin'].includes(membership.role.name)) {
      return errorResponse('You do not have permission to manage members', 403);
    }

    const member = await prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member || member.projectId !== projectId) {
      return notFoundResponse('Member not found');
    }

    const body = await request.json();
    const { roleId } = body;

    if (!roleId) {
      return errorResponse('roleId is required');
    }

    const updated = await prisma.member.update({
      where: { id: memberId },
      data: { roleId },
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

    return successResponse(updated);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Failed to update member');
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{  projectId: string; memberId: string  }> }) {
  const params = await context.params;
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const { projectId, memberId } = params;

    const membership = await prisma.member.findFirst({
      where: { userId: authUser.sub, projectId },
      include: { role: true },
    });

    if (!membership || !['owner', 'admin'].includes(membership.role.name)) {
      return errorResponse('You do not have permission to manage members', 403);
    }

    const member = await prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member || member.projectId !== projectId) {
      return notFoundResponse('Member not found');
    }

    await prisma.member.delete({
      where: { id: memberId },
    });

    return successResponse({ message: 'Member removed' });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Failed to remove member');
  }
}
