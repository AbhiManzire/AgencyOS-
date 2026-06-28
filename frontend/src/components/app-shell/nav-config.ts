import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Briefcase,
  CheckSquare,
  DollarSign,
  LayoutDashboard,
  Megaphone,
  Settings,
  ShoppingCart,
  Users,
} from 'lucide-react';

export interface AppNavItem {
  readonly title: string;
  readonly href: string;
  readonly icon: LucideIcon;
}

export const APP_NAV_ITEMS: readonly AppNavItem[] = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboard },
  { title: 'Clients', href: '/clients', icon: Users },
  { title: 'Sales', href: '/sales', icon: ShoppingCart },
  { title: 'Projects', href: '/projects', icon: Briefcase },
  { title: 'Tasks', href: '/tasks', icon: CheckSquare },
  { title: 'Finance', href: '/finance', icon: DollarSign },
  { title: 'Marketing', href: '/marketing', icon: Megaphone },
  { title: 'Reports', href: '/reports', icon: BarChart3 },
  { title: 'Settings', href: '/settings', icon: Settings },
] as const;
