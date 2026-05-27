import { NextRequest } from 'next/server';
import prisma from '@/server/db';
import { getAuthUser } from '@/server/auth-handler';
import { successResponse, errorResponse, unauthorizedResponse, conflictResponse } from '@/server/utils';

export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const organizations = await prisma.organization.findMany({
      where: {
        OR: [
          { ownerId: authUser.sub },
          {
            projects: {
              some: {
                members: {
                  some: { userId: authUser.sub },
                },
              },
            },
          },
        ],
      },
      include: {
        _count: {
          select: { projects: true },
        },
      },
    });

    return successResponse(organizations);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Failed to fetch organizations');
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const body = await request.json();
    const { name, logoUrl } = body;
    let { slug } = body;

    if (!name || !name.trim()) {
      return errorResponse('Name is required');
    }

    if (!slug) {
      slug = name.toLowerCase().replace(/\s+/g, '-');
    }

    const existingSlug = await prisma.organization.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      return conflictResponse('Organization slug already exists');
    }

    const organization = await prisma.organization.create({
      data: {
        name,
        slug,
        logoUrl,
        ownerId: authUser.sub,
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    return successResponse(organization, 201);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Failed to create organization');
  }
}
