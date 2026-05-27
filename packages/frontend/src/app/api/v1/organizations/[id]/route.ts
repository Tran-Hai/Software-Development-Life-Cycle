import { NextRequest } from 'next/server';
import prisma from '@/server/db';
import { getAuthUser } from '@/server/auth-handler';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/server/utils';

export async function GET(request: NextRequest, context: { params: Promise<{  id: string  }> }) {
  const params = await context.params;
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const { id } = params;

    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        _count: {
          select: { projects: true },
        },
      },
    });

    if (!organization) {
      return notFoundResponse('Organization not found');
    }

    return successResponse(organization);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Failed to fetch organization');
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{  id: string  }> }) {
  const params = await context.params;
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const { id } = params;

    const organization = await prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      return notFoundResponse('Organization not found');
    }

    if (organization.ownerId !== authUser.sub) {
      return errorResponse('Only the owner can update this organization', 403);
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.name !== undefined) data.name = body.name;
    if (body.slug !== undefined) data.slug = body.slug;
    if (body.logoUrl !== undefined) data.logoUrl = body.logoUrl;

    const updated = await prisma.organization.update({
      where: { id },
      data,
    });

    return successResponse(updated);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Failed to update organization');
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{  id: string  }> }) {
  const params = await context.params;
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const { id } = params;

    const organization = await prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      return notFoundResponse('Organization not found');
    }

    if (organization.ownerId !== authUser.sub) {
      return errorResponse('Only the owner can delete this organization', 403);
    }

    await prisma.organization.delete({
      where: { id },
    });

    return successResponse({ message: 'Organization deleted' });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Failed to delete organization');
  }
}
