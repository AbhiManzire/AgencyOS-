import { PermissionRoute } from '@/lib/rbac';

export default function CreditNotesLayout({ children }: { children: React.ReactNode }) {
  return <PermissionRoute permission="finance.credit_notes.read">{children}</PermissionRoute>;
}
