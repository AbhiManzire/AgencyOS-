export interface RbacConfiguration {
  readonly enforced: boolean;
  readonly superAdminRoleSlug: string;
}

export const RBAC_CONFIGURATION = Symbol('RBAC_CONFIGURATION');

export function resolveRbacConfigurationFromEnv(): RbacConfiguration {
  return {
    enforced: process.env.RBAC_ENFORCED === 'true',
    superAdminRoleSlug: process.env.RBAC_SUPER_ADMIN_ROLE_SLUG ?? 'super-admin',
  };
}
