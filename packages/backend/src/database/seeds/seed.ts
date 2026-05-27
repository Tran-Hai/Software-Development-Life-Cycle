import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const hashedPassword = await argon2.hash('Admin123!');

  // Create platform roles
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'super_admin' },
    update: {},
    create: {
      name: 'super_admin',
      description: 'Full system access',
      scope: 'platform',
    },
  });

  const projectOwnerRole = await prisma.role.upsert({
    where: { name: 'owner' },
    update: {},
    create: {
      name: 'owner',
      description: 'Project owner with full control',
      scope: 'project',
    },
  });

  const projectAdminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Project admin',
      scope: 'project',
    },
  });

  const projectMemberRole = await prisma.role.upsert({
    where: { name: 'member' },
    update: {},
    create: {
      name: 'member',
      description: 'Project member',
      scope: 'project',
    },
  });

  const projectViewerRole = await prisma.role.upsert({
    where: { name: 'viewer' },
    update: {},
    create: {
      name: 'viewer',
      description: 'Read-only access',
      scope: 'project',
    },
  });

  console.log('✅ Roles created');

  // Create permissions
  const resources = [
    'project',
    'issue',
    'sprint',
    'document',
    'test_case',
    'test_run',
    'bug',
    'pipeline',
    'webhook',
    'member',
    'setting',
  ];

  const actions = ['create', 'read', 'update', 'delete', 'manage'];

  for (const resource of resources) {
    for (const action of actions) {
      await prisma.permission.upsert({
        where: {
          resource_action: { resource, action },
        },
        update: {},
        create: { resource, action, description: `${action} ${resource}` },
      });
    }
  }

  console.log('✅ Permissions created');

  // Assign all permissions to super_admin and owner
  const allPermissions = await prisma.permission.findMany();
  const allPermissionIds = allPermissions.map((p) => ({
    roleId: superAdminRole.id,
    permissionId: p.id,
  }));

  await prisma.rolePermission.createMany({
    data: allPermissionIds,
    skipDuplicates: true,
  });

  // Owner gets all except delete project (handled separately)
  const ownerPermissions = allPermissions.filter(
    (p) => !(p.resource === 'project' && p.action === 'delete'),
  );

  await prisma.rolePermission.createMany({
    data: ownerPermissions.map((p) => ({
      roleId: projectOwnerRole.id,
      permissionId: p.id,
    })),
    skipDuplicates: true,
  });

  // Admin permissions
  const adminPermissions = allPermissions.filter(
    (p) =>
      !(p.resource === 'setting' && p.action === 'manage') &&
      !(p.resource === 'member' && p.action === 'manage'),
  );

  await prisma.rolePermission.createMany({
    data: adminPermissions.map((p) => ({
      roleId: projectAdminRole.id,
      permissionId: p.id,
    })),
    skipDuplicates: true,
  });

  // Member permissions
  const memberPermissions = allPermissions.filter(
    (p) =>
      (p.resource === 'issue' && ['create', 'read', 'update'].includes(p.action)) ||
      (p.resource === 'sprint' && p.action === 'read') ||
      (p.resource === 'document' && ['create', 'read', 'update'].includes(p.action)) ||
      (p.resource === 'test_case' && ['create', 'read', 'update'].includes(p.action)) ||
      (p.resource === 'test_run' && ['create', 'read', 'update'].includes(p.action)) ||
      (p.resource === 'bug' && ['create', 'read', 'update'].includes(p.action)) ||
      (p.resource === 'pipeline' && p.action === 'read'),
  );

  await prisma.rolePermission.createMany({
    data: memberPermissions.map((p) => ({
      roleId: projectMemberRole.id,
      permissionId: p.id,
    })),
    skipDuplicates: true,
  });

  // Viewer permissions
  const viewerPermissions = allPermissions.filter((p) => p.action === 'read');

  await prisma.rolePermission.createMany({
    data: viewerPermissions.map((p) => ({
      roleId: projectViewerRole.id,
      permissionId: p.id,
    })),
    skipDuplicates: true,
  });

  console.log('✅ Role-Permission mappings created');

  // Create admin user (only if not exists)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@sdlc.dev' },
    update: {},
    create: {
      email: 'admin@sdlc.dev',
      passwordHash: hashedPassword,
      fullName: 'Admin',
      isActive: true,
    },
  });

  // Assign super_admin role to admin user
  const existingUserRole = await prisma.userRole.findFirst({
    where: { userId: adminUser.id, roleId: superAdminRole.id },
  });
  if (!existingUserRole) {
    await prisma.userRole.create({
      data: {
        userId: adminUser.id,
        roleId: superAdminRole.id,
      },
    });
  }

  console.log('✅ Admin user ready (admin@sdlc.dev / Admin123!)');

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
