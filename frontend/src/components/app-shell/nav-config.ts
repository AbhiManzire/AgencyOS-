import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  BookOpen,
  Briefcase,
  Building2,
  CheckSquare,
  ClipboardList,
  DollarSign,
  FileMinus2,
  FileText,
  FolderKanban,
  HeartPulse,
  LayoutDashboard,
  LayoutTemplate,
  Megaphone,
  Package,
  Receipt,
  RefreshCw,
  Settings,
  ShoppingCart,
  Target,
  Users,
  Wallet,
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
  {
    title: 'My Work',
    href: '/sales/my-work',
    icon: ClipboardList,
    permission: 'sales.read',
  },
  { title: 'Clients', href: '/clients', icon: Users, permission: 'clients.read' },
  {
    title: 'Client Success',
    href: '/clients/success',
    icon: HeartPulse,
    permission: 'clients.read',
  },
  {
    title: 'Leads',
    href: '/sales/leads',
    icon: Target,
    permission: 'sales.read',
    activePathPrefixes: ['/sales/leads'],
  },
  {
    title: 'Campaigns',
    href: '/sales/campaigns',
    icon: Megaphone,
    permission: 'sales.read',
  },
  {
    title: 'Sales',
    href: '/sales/pipeline',
    icon: ShoppingCart,
    permission: 'sales.read',
    activePathPrefixes: ['/sales/pipeline', '/sales/deals'],
  },
  { title: 'Quotes', href: '/sales/quotes', icon: FileText, permission: 'quotes.read' },
  {
    title: 'Projects',
    href: '/projects',
    icon: Briefcase,
    permission: 'projects.read',
    activePathPrefixes: ['/projects'],
  },
  {
    title: 'Delivery',
    href: '/projects/delivery',
    icon: FolderKanban,
    permission: 'projects.read',
  },
  {
    title: 'Templates',
    href: '/projects/templates',
    icon: LayoutTemplate,
    permission: 'projects.read',
  },
  { title: 'Tasks', href: '/tasks', icon: CheckSquare, permission: 'tasks.read' },
  {
    title: 'Invoices',
    href: '/finance/invoices',
    icon: DollarSign,
    permission: 'invoices.read',
  },
  { title: 'Payments', href: '/finance/payments', icon: Receipt, permission: 'invoices.read' },
  {
    title: 'Expenses',
    href: '/finance/expenses',
    icon: Wallet,
    permission: 'finance.expenses.read',
  },
  {
    title: 'Vendors',
    href: '/finance/vendors',
    icon: Building2,
    permission: 'finance.vendors.read',
  },
  {
    title: 'Purchases',
    href: '/finance/purchases',
    icon: Package,
    permission: 'finance.purchases.read',
  },
  {
    title: 'Credit Notes',
    href: '/finance/credit-notes',
    icon: FileMinus2,
    permission: 'finance.credit_notes.read',
  },
  {
    title: 'Recurring',
    href: '/finance/recurring',
    icon: RefreshCw,
    permission: 'finance.recurring.read',
  },
  {
    title: 'Ledger',
    href: '/finance/ledger',
    icon: BookOpen,
    permission: 'finance.ledger.read',
  },
  { title: 'Reports', href: '/reports', icon: BarChart3, permission: 'reports.read' },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    permission: ['settings.read', 'workflows.read'],
    match: 'any',
  },
] as const;
