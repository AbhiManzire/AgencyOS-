import { PermissionRoute } from '@/lib/rbac';

export default function RecurringLayout({ children }: { children: React.ReactNode }) {
  return <PermissionRoute permission="finance.recurring.read">{children}</PermissionRoute>;
}
