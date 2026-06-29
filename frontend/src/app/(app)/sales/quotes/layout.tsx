import { PermissionRoute } from '@/lib/rbac';

export default function QuotesLayout({ children }: { children: React.ReactNode }) {
  return <PermissionRoute permission="quotes.read">{children}</PermissionRoute>;
}
