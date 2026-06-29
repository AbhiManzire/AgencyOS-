import { PermissionRoute } from '@/lib/rbac';

export default function ProposalsLayout({ children }: { children: React.ReactNode }) {
  return <PermissionRoute permission="proposals.read">{children}</PermissionRoute>;
}
