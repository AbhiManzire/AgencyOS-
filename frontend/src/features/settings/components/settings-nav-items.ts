import type { SettingsNavItem } from '@/features/settings/api/settings.types';

export const SETTINGS_NAV_ITEMS: readonly SettingsNavItem[] = [
  {
    title: 'Company',
    href: '/settings/company',
    description: 'Agency identity, branding, address, and tax details.',
    permission: 'settings.read',
  },
  {
    title: 'Workspace',
    href: '/settings/workspace',
    description: 'Workspace profile, hours, formats, and archive status.',
    permission: 'settings.read',
  },
  {
    title: 'Preferences',
    href: '/settings/preferences',
    description: 'Category defaults for invoice, finance, sales, and more.',
    permission: 'settings.read',
  },
  {
    title: 'Users',
    href: '/settings/users',
    description: 'Invite members and manage access lifecycle.',
    permission: 'settings.read',
  },
  {
    title: 'Roles',
    href: '/settings/roles',
    description: 'Roles and permission matrix.',
    permission: 'settings.read',
  },
  {
    title: 'Audit Logs',
    href: '/settings/audit',
    description: 'Security and change history for this workspace.',
    permission: 'audit.read',
  },
  {
    title: 'Notifications',
    href: '/settings/notifications',
    description: 'In-app notification inbox.',
    permission: 'notifications.read',
  },
  {
    title: 'Security',
    href: '/settings/security',
    description: 'Password policy, lockout, and personal access tokens.',
    permission: 'security.manage',
  },
  {
    title: 'System',
    href: '/settings/system',
    description: 'Feature flags, maintenance mode, and upload limits.',
    permission: 'admin.system',
  },
  {
    title: 'Workflows',
    href: '/settings/workflows',
    description: 'Automation workflows.',
    permission: 'workflows.read',
  },
] as const;
