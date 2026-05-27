import { SetMetadata } from '@nestjs/common';

export const REQUIRED_PERMISSION_KEY = 'required_permission';

export interface RequiredPermission {
  resource: string;
  action: string;
}

export const RequiredPermission = (resource: string, action: string) =>
  SetMetadata(REQUIRED_PERMISSION_KEY, { resource, action });
