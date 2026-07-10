import { PermissionRoute } from '@/lib/rbac';

export default function SalesLayout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionRoute permission={['sales.read', 'quotes.read', 'proposals.read']} match="any">
      {children}
    </PermissionRoute>
  );
}
