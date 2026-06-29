'use client';

import { PermissionRoute } from '@/lib/rbac';

export default function ClientsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <PermissionRoute permission="clients.read">{children}</PermissionRoute>;
}
