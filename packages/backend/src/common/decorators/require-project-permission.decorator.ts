import { applyDecorators, UseGuards } from '@nestjs/common';
import { ProjectPermissionGuard } from '../guards/project-permission.guard';
import { RequiredPermission } from './required-permission.decorator';

export const RequireProjectPermission = (resource: string, action: string) =>
  applyDecorators(
    UseGuards(ProjectPermissionGuard),
    RequiredPermission(resource, action),
  );
