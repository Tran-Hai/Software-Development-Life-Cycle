import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AddMemberDto, UpdateMemberDto } from './dto/member.dto';

@Injectable()
export class MembersService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async addMember(projectId: string, dto: AddMemberDto, actorId: string) {
    await this.checkPermission(projectId, actorId, ['owner']);

    let targetUserId = dto.userId;

    if (dto.email) {
      const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (!user) {
        throw new NotFoundException('No user found with this email');
      }
      targetUserId = user.id;
    }

    if (!targetUserId) {
      throw new NotFoundException('Either userId or email is required');
    }

    const existingMember = await this.prisma.member.findUnique({
      where: {
        userId_projectId: {
          userId: targetUserId,
          projectId,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException('User is already a member of this project');
    }

    const role = await this.prisma.role.findUnique({
      where: { id: dto.roleId },
    });

    if (!role || role.scope !== 'project') {
      throw new NotFoundException('Invalid role');
    }

    const member = await this.prisma.member.create({
      data: {
        userId: targetUserId,
        projectId,
        roleId: dto.roleId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    const project = await this.prisma.project.findUnique({ where: { id: projectId }, select: { name: true } });

    if (targetUserId !== actorId) {
      await this.notifications.notify({
        userId: targetUserId,
        type: 'member',
        title: `You were added to project "${project?.name || projectId}"`,
        entityType: 'project',
        entityId: projectId,
      });
    }

    return member;
  }

  async findAll(projectId: string) {
    return this.prisma.member.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  async updateMember(
    projectId: string,
    memberId: string,
    dto: UpdateMemberDto,
    actorId: string,
  ) {
    await this.checkPermission(projectId, actorId, ['owner', 'admin']);

    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member || member.projectId !== projectId) {
      throw new NotFoundException('Member not found');
    }

    return this.prisma.member.update({
      where: { id: memberId },
      data: { roleId: dto.roleId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });
  }

  async removeMember(projectId: string, memberId: string, actorId: string) {
    await this.checkPermission(projectId, actorId, ['owner', 'admin']);

    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      include: {
        user: { select: { fullName: true } },
      },
    });

    if (!member || member.projectId !== projectId) {
      throw new NotFoundException('Member not found');
    }

    await this.prisma.member.delete({
      where: { id: memberId },
    });

    if (member.userId !== actorId) {
      const project = await this.prisma.project.findUnique({ where: { id: projectId }, select: { name: true } });
      await this.notifications.notify({
        userId: member.userId,
        type: 'member',
        title: `You were removed from project "${project?.name || projectId}"`,
        entityType: 'project',
        entityId: projectId,
      });
    }
  }

  private async checkPermission(
    projectId: string,
    userId: string,
    requiredRoles: string[],
  ) {
    const membership = await this.prisma.member.findFirst({
      where: { userId, projectId },
      include: { role: true },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this project');
    }

    if (!requiredRoles.includes(membership.role.name)) {
      throw new ForbiddenException('You do not have permission to manage members');
    }
  }
}
