import { NextRequest } from 'next/server';
import prisma from '@/server/db';
import { getAuthUser } from '@/server/auth-handler';
import { successResponse, errorResponse, unauthorizedResponse } from '@/server/utils';

export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const roles = await prisma.role.findMany({
      include: {
        _count: { select: { permissions: true } },
      },
    });

    return successResponse(roles);
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const body = await request.json();
    if (!body.name) return errorResponse('Name is required', 400);

    const role = await prisma.role.create({
      data: {
        name: body.name,
        description: body.description,
        scope: body.scope,
      },
    });

    if (body.permissionIds && body.permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: body.permissionIds.map((permissionId: string) => ({
          roleId: role.id,
          permissionId,
        })),
      });
    }

    return successResponse(role, 201);
  } catch (error) {
    if ((error as { code?: string }).code === 'P2002') {
      return errorResponse('Role with this name already exists', 409);
    }
    return errorResponse('Internal server error', 500);
  }
}
