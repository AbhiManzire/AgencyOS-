export const SUPER_ADMIN_ROLE_SLUG = 'super-admin';

export const DEFAULT_SYSTEM_ROLE_SLUGS = [
  'super-admin',
  'founder',
  'admin',
  'manager',
  'sales',
  'marketing',
  'finance',
  'project-manager',
  'developer',
  'designer',
  'qa',
  'support',
  'client',
  'viewer',
] as const;

export type DefaultSystemRoleSlug = (typeof DEFAULT_SYSTEM_ROLE_SLUGS)[number];

export const ADMIN_ROLE_SLUGS = ['super-admin', 'founder', 'admin'] as const;

export const RBAC_SCOPE_HEADERS = {
  TENANT: 'x-tenant-id',
  WORKSPACE: 'x-workspace-id',
  USER: 'x-user-id',
} as const;

export const PERMISSION_CONTEXT_REQUEST_KEY = 'permissionContext';
