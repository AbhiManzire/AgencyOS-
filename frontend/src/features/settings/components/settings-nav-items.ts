import type { SettingsNavItem } from '@/features/settings/api/settings.types';

export const SETTINGS_NAV_ITEMS: readonly SettingsNavItem[] = [
  {
    title: 'Company Profile',
    href: '/settings/company',
    description: 'Agency name and legal identity.',
    permission: 'settings.read',
  },
  {
    title: 'Workspace',
    href: '/settings/workspace',
    description: 'Workspace name and status.',
    permission: 'settings.read',
  },
  {
    title: 'Preferences',
    href: '/settings/preferences',
    description: 'Timezone and currency defaults.',
    permission: 'settings.read',
  },
  {
    title: 'Users',
    href: '/settings/users',
    description: 'Workspace members and role assignments.',
    permission: 'settings.read',
  },
  {
    title: 'Roles',
    href: '/settings/roles',
    description: 'Roles and permission catalogs.',
    permission: 'settings.read',
  },
  {
    title: 'Workflows',
    href: '/settings/workflows',
    description: 'Automation workflows.',
    permission: 'workflows.read',
  },
] as const;
