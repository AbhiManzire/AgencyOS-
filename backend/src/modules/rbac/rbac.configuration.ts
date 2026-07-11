export interface RbacConfiguration {
  readonly enforced: boolean;
  readonly superAdminRoleSlug: string;
}

export const RBAC_CONFIGURATION = Symbol('RBAC_CONFIGURATION');

export function resolveRbacConfigurationFromEnv(): RbacConfiguration {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const enforced = process.env.RBAC_ENFORCED === 'true';
  const authDisabled =
    (process.env.AUTH_ENABLED ?? 'true').trim().toLowerCase() === 'false';

  // When AUTH_ENABLED=false (demo), RBAC may also be off and must not require JWT claims.
  if (nodeEnv === 'production' && !enforced && !authDisabled) {
    throw new Error('Production requires RBAC_ENFORCED=true.');
  }

  return {
    enforced,
    superAdminRoleSlug: process.env.RBAC_SUPER_ADMIN_ROLE_SLUG ?? 'super-admin',
  };
}
