'use client';

import type { LucideIcon } from 'lucide-react';
import { FileText, FolderKanban, Plus, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/design-system';
import { Caption, CardTitle } from '@/design-system/typography';
import { Can } from '@/lib/rbac';
import { cn } from '@/lib/utils';

interface QuickActionItem {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly icon: LucideIcon;
  readonly permission?: string;
  readonly disabled?: boolean;
  readonly href?: string;
  readonly onClick?: () => void;
}

interface DashboardQuickActionsProps {
  readonly onNewClient: () => void;
}

function QuickActionCard({ item }: { readonly item: QuickActionItem }) {
  const content = (
    <Card
      padding
      shadow="none"
      className={cn(
        'h-full transition-colors',
        item.disabled
          ? 'cursor-not-allowed opacity-60'
          : 'cursor-pointer hover:border-primary/30 hover:bg-muted/30',
      )}
    >
      <CardContent className="flex items-start gap-3 p-0">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <item.icon className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-sm">{item.label}</CardTitle>
          <Caption>{item.description}</Caption>
        </div>
      </CardContent>
    </Card>
  );

  const card = item.disabled ? (
    <div aria-disabled="true" className="h-full">
      {content}
    </div>
  ) : item.href !== undefined ? (
    <Link href={item.href} className="block h-full">
      {content}
    </Link>
  ) : (
    <button type="button" className="block h-full w-full text-left" onClick={item.onClick}>
      {content}
    </button>
  );

  if (item.permission === undefined) {
    return card;
  }

  return (
    <Can permission={item.permission} mode="hide">
      {card}
    </Can>
  );
}

export function DashboardQuickActions({ onNewClient }: DashboardQuickActionsProps) {
  const actions: QuickActionItem[] = [
    {
      id: 'new-client',
      label: 'New Client',
      description: 'Add a client organization',
      icon: Plus,
      permission: 'clients.create',
      onClick: onNewClient,
    },
    {
      id: 'new-contact',
      label: 'New Contact',
      description: 'Open a client to add contacts',
      icon: UserPlus,
      permission: 'clients.contacts.manage',
      href: '/clients',
    },
    {
      id: 'new-project',
      label: 'New Project',
      description: 'Create a client project',
      icon: FolderKanban,
      permission: 'projects.create',
      href: '/projects',
    },
    {
      id: 'create-invoice',
      label: 'Create Invoice',
      description: 'Open the invoices workspace',
      icon: FileText,
      permission: 'invoices.create',
      href: '/finance/invoices',
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {actions.map((item) => (
        <QuickActionCard key={item.id} item={item} />
      ))}
    </div>
  );
}
