import { PermissionRoute } from '@/lib/rbac';

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return <PermissionRoute permission="reports.read">{children}</PermissionRoute>;
}
