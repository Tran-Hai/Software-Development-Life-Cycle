import { NextRequest } from 'next/server';
import prisma from '@/server/db';
import { getAuthUser } from '@/server/auth-handler';
import { successResponse, errorResponse, unauthorizedResponse, conflictResponse } from '@/server/utils';

export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const projects = await prisma.project.findMany({
      where: {
        members: {
          some: { userId: authUser.sub },
        },
        status: 'active',
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            issues: true,
            members: true,
            sprints: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(projects);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Failed to fetch projects');
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const body = await request.json();
    const { name, description } = body;
    let { key } = body;

    if (!name || !name.trim()) {
      return errorResponse('Name is required');
    }

    if (!key) {
      key = name.toUpperCase().replace(/\s+/g, '-').slice(0, 4);
    }

    const existingKey = await prisma.project.findUnique({
      where: { key },
    });

    if (existingKey) {
      return conflictResponse('Project key already exists');
    }

    let org = await prisma.organization.findFirst({
      where: { ownerId: authUser.sub },
    });

    if (!org) {
      org = await prisma.organization.create({
        data: {
          name: `${authUser.sub.slice(0, 8)}'s Workspace`,
          slug: `workspace-${authUser.sub.slice(0, 8)}`,
          ownerId: authUser.sub,
        },
      });
    }

    const project = await prisma.project.create({
      data: {
        organizationId: org.id,
        name,
        key,
        description,
        visibility: 'private',
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    const ownerRole = await prisma.role.upsert({
      where: { name: 'owner' },
      update: {},
      create: {
        name: 'owner',
        description: 'Project owner with full control',
        scope: 'project',
      },
    });

    await prisma.member.create({
      data: {
        userId: authUser.sub,
        projectId: project.id,
        roleId: ownerRole.id,
      },
    });

    const defaultIssueTypes = [
      { name: 'task', icon: 'task', color: '#3b82f6' },
      { name: 'bug', icon: 'bug', color: '#ef4444' },
      { name: 'story', icon: 'story', color: '#22c55e' },
      { name: 'epic', icon: 'epic', color: '#a855f7' },
      { name: 'subtask', icon: 'subtask', color: '#f59e0b' },
    ];

    for (const it of defaultIssueTypes) {
      await prisma.issueType.create({
        data: {
          projectId: project.id,
          name: it.name,
          icon: it.icon,
          color: it.color,
        },
      });
    }

    return successResponse(project, 201);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Failed to create project');
  }
}
