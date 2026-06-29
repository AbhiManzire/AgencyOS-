import { SetMetadata } from '@nestjs/common';

export const REQUIRED_PERMISSIONS_KEY = 'requiredPermissions';

/** Requires one or more permission keys on a route handler or controller class. */
export const RequirePermissions = (...permissionKeys: string[]) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, permissionKeys);
