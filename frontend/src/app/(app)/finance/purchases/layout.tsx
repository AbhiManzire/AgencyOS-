import { PermissionRoute } from '@/lib/rbac';

export default function PurchasesLayout({ children }: { children: React.ReactNode }) {
  return <PermissionRoute permission="finance.purchases.read">{children}</PermissionRoute>;
}
