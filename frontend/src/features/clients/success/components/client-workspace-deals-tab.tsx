'use client';

import Link from 'next/link';
import { EmptyState } from '@/design-system';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ClientWorkspaceDeal } from '@/features/clients/success/api/client-success.types';
import { formatShortDate } from '@/lib/format/date';
import { formatMoney } from '@/lib/format/money';

interface ClientWorkspaceDealsTabProps {
  readonly deals: readonly ClientWorkspaceDeal[];
}

function toAmount(value: number | string): number {
  return typeof value === 'number' ? value : Number(value);
}

export function ClientWorkspaceDealsTab({ deals }: ClientWorkspaceDealsTabProps) {
  if (deals.length === 0) {
    return (
      <EmptyState title="No deals" description="Deals linked to this client will appear here." />
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Expected close</TableHead>
            <TableHead>Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deals.map((deal) => (
            <TableRow key={deal.id}>
              <TableCell>
                <Link
                  href={`/sales/deals/${deal.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {deal.title}
                </Link>
              </TableCell>
              <TableCell>{deal.stage}</TableCell>
              <TableCell>{deal.status}</TableCell>
              <TableCell>{formatMoney(toAmount(deal.value), deal.currency)}</TableCell>
              <TableCell>{formatShortDate(deal.expectedCloseDate)}</TableCell>
              <TableCell>{formatShortDate(deal.updatedAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
