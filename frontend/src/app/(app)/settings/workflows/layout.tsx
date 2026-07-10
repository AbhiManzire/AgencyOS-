import { PermissionRoute } from '@/lib/rbac';

export default function WorkflowsLayout({ children }: { readonly children: React.ReactNode }) {
  return <PermissionRoute permission="workflows.read">{children}</PermissionRoute>;
}
