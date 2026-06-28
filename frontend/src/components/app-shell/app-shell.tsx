'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { AppHeader } from './app-header';
import { AppMain } from './app-main';
import { AppSidebar } from './app-sidebar';

interface AppShellProps {
  children: ReactNode;
}

/** Reusable authenticated application shell for all dashboard routes. */
export function AppShell({ children }: AppShellProps) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setCollapsed(isTablet);
  }, [isTablet]);

  useEffect(() => {
    if (!isMobile) {
      setMobileOpen(false);
    }
  }, [isMobile]);

  const sidebarWidth = collapsed ? '4rem' : '16rem';

  return (
    <div className="min-h-svh bg-background text-foreground">
      {!isMobile && (
        <div
          className="fixed inset-y-0 left-0 z-30 hidden transition-[width] duration-200 md:block"
          style={{ width: sidebarWidth }}
        >
          <AppSidebar collapsed={collapsed} />
        </div>
      )}

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0 md:hidden">
          <AppSidebar
            collapsed={false}
            onNavigate={() => {
              setMobileOpen(false);
            }}
          />
        </SheetContent>
      </Sheet>

      <div
        className={cn('flex min-h-svh flex-col transition-[margin] duration-200')}
        style={{ marginLeft: isMobile ? undefined : sidebarWidth }}
      >
        <AppHeader
          collapsed={collapsed}
          onToggleSidebar={() => {
            setCollapsed((current) => !current);
          }}
          onOpenMobileMenu={() => {
            setMobileOpen(true);
          }}
          showMobileMenuButton={isMobile}
        />

        <AppMain>{children}</AppMain>
      </div>
    </div>
  );
}
