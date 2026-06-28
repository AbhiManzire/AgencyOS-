'use client';

import { Bell, Menu, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppBreadcrumb } from './app-breadcrumb';

interface AppHeaderProps {
  collapsed: boolean;
  onToggleSidebar: () => void;
  onOpenMobileMenu: () => void;
  showMobileMenuButton: boolean;
}

export function AppHeader({
  collapsed,
  onToggleSidebar,
  onOpenMobileMenu,
  showMobileMenuButton,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {showMobileMenuButton ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
        >
          <Menu className="size-5" />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
        </Button>
      )}

      <AppBreadcrumb />

      <div className="relative mx-4 hidden max-w-md flex-1 md:flex">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          placeholder="Search..."
          readOnly
          aria-label="Global search"
          className="pl-9"
        />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="size-5" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="User account menu">
          <span className="flex size-8 items-center justify-center rounded-full bg-muted" />
        </Button>
      </div>
    </header>
  );
}
