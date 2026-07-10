export interface RbacConfiguration {
  readonly enforced: boolean;
  readonly superAdminRoleSlug: string;
}

export const RBAC_CONFIGURATION = Symbol('RBAC_CONFIGURATION');

export function resolveRbacConfigurationFromEnv(): RbacConfiguration {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const enforced = process.env.RBAC_ENFORCED === 'true';

  if (nodeEnv === 'production' && !enforced) {
    throw new Error('Production requires RBAC_ENFORCED=true.');
  }

  return {
    enforced,
    superAdminRoleSlug: process.env.RBAC_SUPER_ADMIN_ROLE_SLUG ?? 'super-admin',
  };
}
