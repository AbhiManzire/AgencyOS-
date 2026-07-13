'use client';

import { PageContainer } from '@/design-system';
import { SettingsSubnav } from '@/features/settings/components/settings-subnav';
import { PermissionRoute } from '@/lib/rbac';

const SETTINGS_ACCESS_PERMISSIONS = [
  'settings.read',
  'workflows.read',
  'integrations.read',
  'audit.read',
  'notifications.read',
  'security.manage',
  'admin.system',
] as const;

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionRoute permission={SETTINGS_ACCESS_PERMISSIONS} match="any">
      <PageContainer size="2xl">
        <SettingsSubnav />
        <div className="pt-6">{children}</div>
      </PageContainer>
    </PermissionRoute>
  );
}
