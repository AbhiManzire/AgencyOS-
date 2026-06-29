'use client';

import { PermissionRoute } from '@/lib/rbac';

export default function ProjectsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <PermissionRoute permission="projects.read">{children}</PermissionRoute>;
}
