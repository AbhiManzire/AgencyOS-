'use client';

import { PageContainer } from '@/design-system';
import { SettingsSubnav } from '@/features/settings/components/settings-subnav';
import { PermissionRoute } from '@/lib/rbac';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionRoute permission={['settings.read', 'workflows.read']} match="any">
      <PageContainer size="2xl">
        <SettingsSubnav />
        <div className="pt-6">{children}</div>
      </PageContainer>
    </PermissionRoute>
  );
}
