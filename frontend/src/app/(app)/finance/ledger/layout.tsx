import { PermissionRoute } from '@/lib/rbac';

export default function LedgerLayout({ children }: { children: React.ReactNode }) {
  return <PermissionRoute permission="finance.ledger.read">{children}</PermissionRoute>;
}
