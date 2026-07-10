import { PermissionRoute } from '@/lib/rbac';

export default function SalesDealsLayout({ children }: { children: React.ReactNode }) {
  return <PermissionRoute permission="sales.read">{children}</PermissionRoute>;
}
