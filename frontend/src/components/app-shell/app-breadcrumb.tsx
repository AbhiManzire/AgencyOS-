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

function resolveBreadcrumbLabel(pathname: string): string {
  const match = APP_NAV_ITEMS.find((item) => item.href === pathname);
  return match?.title ?? 'Page';
}

/** Placeholder breadcrumb for the application shell. */
export function AppBreadcrumb() {
  const pathname = usePathname();
  const currentLabel = resolveBreadcrumbLabel(pathname);

  return (
    <Breadcrumb className="hidden min-w-0 sm:block">
      <BreadcrumbList>
        <BreadcrumbItem>
          <span className="text-muted-foreground">AgencyOS</span>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{currentLabel}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
