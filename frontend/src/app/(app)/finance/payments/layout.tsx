import { PermissionRoute } from '@/lib/rbac';

export default function PaymentsLayout({ children }: { children: React.ReactNode }) {
  return <PermissionRoute permission="invoices.read">{children}</PermissionRoute>;
}
