'use client';

import { usePathname } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { APP_NAV_ITEMS } from './nav-config';

const SEGMENT_LABELS: Record<string, string> = {
  clients: 'Clients',
  sales: 'Sales',
  pipeline: 'Pipeline',
  deals: 'Deals',
  quotes: 'Quotes',
  proposals: 'Proposals',
  projects: 'Projects',
  tasks: 'Tasks',
  board: 'Board',
  finance: 'Finance',
  invoices: 'Invoices',
  payments: 'Payments',
  reports: 'Reports',
  settings: 'Settings',
  company: 'Company',
  workspace: 'Workspace',
  preferences: 'Preferences',
  users: 'Users',
  roles: 'Roles',
  workflows: 'Workflows',
};

function resolveNavLabel(pathname: string): string | null {
  const exact = APP_NAV_ITEMS.find((item) => item.href === pathname);
  if (exact) {
    return exact.title;
  }

  const prefix = APP_NAV_ITEMS.find(
    (item) => item.href !== '/' && (pathname === item.href || pathname.startsWith(`${item.href}/`)),
  );
  return prefix?.title ?? null;
}

function resolveSegmentLabel(segment: string): string {
  if (SEGMENT_LABELS[segment]) {
    return SEGMENT_LABELS[segment];
  }

  if (/^[0-9a-f-]{36}$/i.test(segment)) {
    return 'Detail';
  }

  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

/** Application shell breadcrumb derived from the current route. */
export function AppBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const navLabel = resolveNavLabel(pathname);
  const leafLabel =
    segments.length === 0
      ? 'Dashboard'
      : resolveSegmentLabel(segments[segments.length - 1] ?? 'Page');

  const currentLabel =
    segments.length <= 1
      ? (navLabel ?? leafLabel)
      : `${navLabel ?? resolveSegmentLabel(segments[0] ?? '')} · ${leafLabel}`;

  return (
    <Breadcrumb className="hidden min-w-0 sm:block">
      <BreadcrumbList>
        <BreadcrumbItem>
          <span className="text-muted-foreground">AgencyOS</span>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage className="truncate">{currentLabel}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
