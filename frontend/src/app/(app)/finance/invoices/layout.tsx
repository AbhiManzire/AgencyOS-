import { PermissionRoute } from '@/lib/rbac';

export default function InvoicesLayout({ children }: { children: React.ReactNode }) {
  return <PermissionRoute permission="invoices.read">{children}</PermissionRoute>;
}
