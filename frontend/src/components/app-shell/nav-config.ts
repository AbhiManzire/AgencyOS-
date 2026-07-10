import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Briefcase,
  CheckSquare,
  DollarSign,
  FileText,
  LayoutDashboard,
  Receipt,
  Settings,
  ShoppingCart,
  Users,
} from 'lucide-react';

export interface AppNavItem {
  readonly title: string;
  readonly href: string;
  readonly icon: LucideIcon;
  readonly permission?: string | readonly string[];
  readonly match?: 'all' | 'any';
  /** Optional path prefixes that should mark this nav item active. */
  readonly activePathPrefixes?: readonly string[];
}

export const APP_NAV_ITEMS: readonly AppNavItem[] = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboard, permission: 'dashboard.read' },
  { title: 'Clients', href: '/clients', icon: Users, permission: 'clients.read' },
  {
    title: 'Sales',
    href: '/sales/pipeline',
    icon: ShoppingCart,
    permission: 'sales.read',
    activePathPrefixes: ['/sales/pipeline', '/sales/deals'],
  },
  { title: 'Quotes', href: '/sales/quotes', icon: FileText, permission: 'quotes.read' },
  { title: 'Projects', href: '/projects', icon: Briefcase, permission: 'projects.read' },
  { title: 'Tasks', href: '/tasks', icon: CheckSquare, permission: 'tasks.read' },
  { title: 'Finance', href: '/finance/invoices', icon: DollarSign, permission: 'invoices.read' },
  { title: 'Payments', href: '/finance/payments', icon: Receipt, permission: 'invoices.read' },
  { title: 'Reports', href: '/reports', icon: BarChart3, permission: 'reports.read' },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    permission: ['settings.read', 'workflows.read'],
    match: 'any',
  },
] as const;
