import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { AddMemberDto, UpdateMemberDto } from './dto/member.dto';

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

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

    return this.prisma.member.create({
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
    });

    if (!member || member.projectId !== projectId) {
      throw new NotFoundException('Member not found');
    }

    return this.prisma.member.delete({
      where: { id: memberId },
    });
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
