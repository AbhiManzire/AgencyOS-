import { PermissionRoute } from '@/lib/rbac';

export default function VendorsLayout({ children }: { children: React.ReactNode }) {
  return <PermissionRoute permission="finance.vendors.read">{children}</PermissionRoute>;
}
