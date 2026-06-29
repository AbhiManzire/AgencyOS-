'use client';

import { PermissionRoute } from '@/lib/rbac';

export default function TasksLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <PermissionRoute permission="tasks.read">{children}</PermissionRoute>;
}
