import { PermissionRoute } from '@/lib/rbac';

export default function ExpensesLayout({ children }: { children: React.ReactNode }) {
  return <PermissionRoute permission="finance.expenses.read">{children}</PermissionRoute>;
}
