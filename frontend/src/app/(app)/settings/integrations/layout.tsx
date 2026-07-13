import { PermissionRoute } from '@/lib/rbac';

export default function IntegrationsLayout({ children }: { readonly children: React.ReactNode }) {
  return <PermissionRoute permission="integrations.read">{children}</PermissionRoute>;
}
