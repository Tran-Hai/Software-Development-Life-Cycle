import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(organizationId: string | undefined, userId: string, dto: CreateProjectDto) {
    let orgId = organizationId;

    if (!orgId) {
      let org = await this.prisma.organization.findFirst({
        where: { ownerId: userId },
      });

      if (!org) {
        org = await this.prisma.organization.create({
          data: {
            name: `${userId.slice(0, 8)}'s Workspace`,
            slug: `workspace-${userId.slice(0, 8)}`,
            ownerId: userId,
          },
        });
      }

      orgId = org.id;
    } else {
      const org = await this.prisma.organization.findUnique({
        where: { id: organizationId },
      });

      if (!org) {
        throw new NotFoundException('Organization not found');
      }
    }

    const existingKey = await this.prisma.project.findUnique({
      where: { key: dto.key },
    });

    if (existingKey) {
      throw new ConflictException('Project key already exists');
    }

    const project = await this.prisma.project.create({
      data: {
        organizationId: orgId,
        name: dto.name,
        key: dto.key,
        description: dto.description,
        visibility: dto.visibility || 'private',
        settings: {
          create: {
            sprintDurationDays: 14,
            timezone: 'UTC',
          },
        },
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        settings: true,
      },
    });

    const ownerRole = await this.prisma.role.upsert({
      where: { name: 'owner' },
      update: {},
      create: {
        name: 'owner',
        description: 'Project owner with full control',
        scope: 'project',
      },
    });

    await this.prisma.member.create({
      data: {
        userId,
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
      await this.prisma.issueType.create({
        data: {
          projectId: project.id,
          name: it.name,
          icon: it.icon,
          color: it.color,
        },
      });
    }

    await this.notifications.notify({
      userId,
      type: 'project',
      title: `Project "${project.name}" created successfully`,
      entityType: 'project',
      entityId: project.id,
    });

    return project;
  }

  async findAll(userId: string) {
    return this.prisma.project.findMany({
      where: {
        members: {
          some: { userId },
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
  }

  async findOne(id: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
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
      throw new NotFoundException('Project not found');
    }

    const isMember = await this.prisma.member.findFirst({
      where: { userId, projectId: id },
    });

    if (!isMember) {
      throw new ForbiddenException('You are not a member of this project');
    }

    return project;
  }

  async update(id: string, userId: string, dto: UpdateProjectDto) {
    await this.checkProjectAccess(id, userId);

    const project = await this.prisma.project.update({
      where: { id },
      data: dto,
    });

    const actor = await this.prisma.user.findUnique({ where: { id: userId }, select: { fullName: true } });
    await this.notifications.notifyProject(id, {
      type: 'project',
      title: `${actor?.fullName || 'Someone'} updated project settings`,
      entityType: 'project',
      entityId: id,
    });

    return project;
  }

  async delete(id: string, userId: string) {
    await this.checkProjectAccess(id, userId, ['owner']);

    return this.prisma.project.delete({
      where: { id },
    });
  }

  private async checkProjectAccess(
    projectId: string,
    userId: string,
    requiredRoles: string[] = ['owner', 'admin'],
  ) {
    const membership = await this.prisma.member.findFirst({
      where: { userId, projectId },
      include: { role: true },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this project');
    }

    if (requiredRoles.length > 0 && !requiredRoles.includes(membership.role.name)) {
      throw new ForbiddenException('You do not have permission to perform this action');
    }
  }
}
