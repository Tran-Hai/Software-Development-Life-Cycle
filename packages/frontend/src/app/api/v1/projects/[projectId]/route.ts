import { NextRequest } from 'next/server';
import prisma from '@/server/db';
import { getAuthUser } from '@/server/auth-handler';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/server/utils';

export async function GET(request: NextRequest, context: { params: Promise<{  projectId: string  }> }) {
  const params = await context.params;
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const { projectId } = params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        settings: true,
        issueTypes: true,
        _count: {
          select: {
            issues: true,
            members: true,
            sprints: true,
          },
        },
      },
    });

    if (!project) {
      return notFoundResponse('Project not found');
    }

    const isMember = await prisma.member.findFirst({
      where: { userId: authUser.sub, projectId },
    });

    if (!isMember) {
      return errorResponse('You are not a member of this project', 403);
    }

    return successResponse(project);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Failed to fetch project');
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{  projectId: string  }> }) {
  const params = await context.params;
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const { projectId } = params;

    const membership = await prisma.member.findFirst({
      where: { userId: authUser.sub, projectId },
      include: { role: true },
    });

    if (!membership) {
      return errorResponse('You are not a member of this project', 403);
    }

    if (!['owner', 'admin'].includes(membership.role.name)) {
      return errorResponse('You do not have permission to perform this action', 403);
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.name !== undefined) data.name = body.name;
    if (body.key !== undefined) data.key = body.key;
    if (body.description !== undefined) data.description = body.description;
    if (body.visibility !== undefined) data.visibility = body.visibility;
    if (body.status !== undefined) data.status = body.status;

    const project = await prisma.project.update({
      where: { id: projectId },
      data,
    });

    return successResponse(project);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Failed to update project');
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{  projectId: string  }> }) {
  const params = await context.params;
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const { projectId } = params;

    const membership = await prisma.member.findFirst({
      where: { userId: authUser.sub, projectId },
      include: { role: true },
    });

    if (!membership) {
      return errorResponse('You are not a member of this project', 403);
    }

    if (!['owner', 'admin'].includes(membership.role.name)) {
      return errorResponse('You do not have permission to delete this project', 403);
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    return successResponse({ message: 'Project deleted' });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Failed to delete project');
  }
}
