import { NextRequest } from 'next/server';
import prisma from '@/server/db';
import { getAuthUser } from '@/server/auth-handler';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/server/utils';

export async function GET(request: NextRequest, context: { params: Promise<{  id: string  }> }) {
  const params = await context.params;
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const role = await prisma.role.findUnique({
      where: { id: params.id },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    if (!role) return notFoundResponse('Role not found');

    return successResponse(role);
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{  id: string  }> }) {
  const params = await context.params;
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const existing = await prisma.role.findUnique({ where: { id: params.id } });
    if (!existing) return notFoundResponse('Role not found');

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;

    if (Object.keys(updateData).length > 0) {
      await prisma.role.update({
        where: { id: params.id },
        data: updateData,
      });
    }

    if (body.permissionIds !== undefined) {
      await prisma.rolePermission.deleteMany({ where: { roleId: params.id } });

      if (body.permissionIds.length > 0) {
        await prisma.rolePermission.createMany({
          data: body.permissionIds.map((permissionId: string) => ({
            roleId: params.id,
            permissionId,
          })),
        });
      }
    }

    const role = await prisma.role.findUnique({
      where: { id: params.id },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    return successResponse(role);
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{  id: string  }> }) {
  const params = await context.params;
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const existing = await prisma.role.findUnique({ where: { id: params.id } });
    if (!existing) return notFoundResponse('Role not found');

    await prisma.role.delete({ where: { id: params.id } });

    return successResponse({ message: 'Role deleted' });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
