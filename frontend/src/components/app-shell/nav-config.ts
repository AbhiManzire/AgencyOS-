import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Briefcase,
  CheckSquare,
  DollarSign,
  FileText,
  GitBranch,
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
  readonly permission?: string;
}

export const APP_NAV_ITEMS: readonly AppNavItem[] = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboard, permission: 'dashboard.read' },
  { title: 'Clients', href: '/clients', icon: Users, permission: 'clients.read' },
  { title: 'Sales', href: '/sales/pipeline', icon: ShoppingCart, permission: 'sales.read' },
  { title: 'Quotes', href: '/sales/quotes', icon: FileText, permission: 'quotes.read' },
  { title: 'Projects', href: '/projects', icon: Briefcase, permission: 'projects.read' },
  { title: 'Tasks', href: '/tasks', icon: CheckSquare, permission: 'tasks.read' },
  { title: 'Finance', href: '/finance/invoices', icon: DollarSign, permission: 'invoices.read' },
  { title: 'Marketing', href: '/marketing', icon: Megaphone },
  { title: 'Reports', href: '/reports', icon: BarChart3 },
  {
    title: 'Workflows',
    href: '/settings/workflows',
    icon: GitBranch,
    permission: 'workflows.read',
  },
  { title: 'Settings', href: '/settings', icon: Settings },
] as const;
