import prisma from './db';

interface RoleInfo {
  id: string;
  name: string;
  scope: string;
}

export async function getUserRoles(userId: string, projectId?: string): Promise<RoleInfo[]> {
  const roles: RoleInfo[] = [];

  const userRoles = await prisma.userRole.findMany({
    where: {
      userId,
      ...(projectId
        ? { projectId: { in: [projectId, 'none'] } }
        : { projectId: 'none' }),
    },
    include: { role: true },
  });

  for (const ur of userRoles) {
    roles.push({ id: ur.role.id, name: ur.role.name, scope: ur.role.scope });
  }

  if (projectId) {
    const member = await prisma.member.findUnique({
      where: { userId_projectId: { userId, projectId } },
      include: { role: true },
    });

    if (member && !roles.some((r) => r.id === member.roleId)) {
      roles.push({ id: member.role.id, name: member.role.name, scope: member.role.scope });
    }
  }

  return roles;
}

export async function checkPermission(
  userId: string,
  projectId: string,
  resource: string,
  action: string,
): Promise<boolean> {
  const roles = await getUserRoles(userId, projectId);

  const roleIds = roles.map((r) => r.id);

  if (roleIds.length === 0) return false;

  const permission = await prisma.permission.findUnique({
    where: { resource_action: { resource, action } },
  });

  if (!permission) return false;

  const count = await prisma.rolePermission.count({
    where: {
      roleId: { in: roleIds },
      permissionId: permission.id,
    },
  });

  return count > 0;
}
