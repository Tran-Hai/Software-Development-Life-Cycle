import { NextRequest } from 'next/server';
import prisma from '@/server/db';
import { getAuthUser } from '@/server/auth-handler';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/server/utils';

export async function POST(request: NextRequest, context: { params: Promise<{  orgId: string  }> }) {
  const params = await context.params;
  try {
    const auth = getAuthUser(request);
    if (!auth) return unauthorizedResponse();
    const userId = auth.sub;

    const organization = await prisma.organization.findUnique({ where: { id: params.orgId } });
    if (!organization) return notFoundResponse('Organization not found');

    const body = await request.json();
    if (!body.name) return errorResponse('Name is required', 400);

    const key = body.key || body.name.substring(0, 4).toUpperCase();

    const project = await prisma.project.create({
      data: {
        organizationId: params.orgId,
        name: body.name,
        key,
        description: body.description,
        visibility: body.visibility || 'private',
      },
    });

    const adminRole = await prisma.role.findFirst({
      where: { name: 'admin', scope: 'project' },
    });

    if (adminRole) {
      await prisma.member.create({
        data: {
          userId,
          projectId: project.id,
          roleId: adminRole.id,
        },
      });
    }

    return successResponse(project, 201);
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
