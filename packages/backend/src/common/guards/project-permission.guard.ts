import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../database/prisma/prisma.service';
import { REQUIRED_PERMISSION_KEY, RequiredPermission } from '../decorators/required-permission.decorator';

@Injectable()
export class ProjectPermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    const requiredPermission = this.reflector.get<RequiredPermission>(
      REQUIRED_PERMISSION_KEY,
      context.getHandler(),
    );

    if (!requiredPermission) {
      return true;
    }

    const projectId =
      request.params.projectId || request.params.id || request.body?.projectId;

    if (!projectId) {
      return true;
    }

    const membership = await this.prisma.member.findFirst({
      where: {
        userId: user.id,
        projectId,
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this project');
    }

    const hasPermission = membership.role.permissions.some(
      (rp) =>
        rp.permission.resource === requiredPermission.resource &&
        rp.permission.action === requiredPermission.action,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `You do not have permission to ${requiredPermission.action} ${requiredPermission.resource}`,
      );
    }

    return true;
  }
}
