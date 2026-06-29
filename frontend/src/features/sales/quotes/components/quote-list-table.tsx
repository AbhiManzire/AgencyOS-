'use client';

import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { QuoteStatusBadge } from '@/features/sales/quotes/components/quote-status-badge';
import {
  formatQuoteAmount,
  formatQuoteDate,
} from '@/features/sales/quotes/forms/quote-form.validation';
import type { QuoteListItem } from '@/features/sales/quotes/types';

interface QuoteListTableProps {
  readonly quotes: readonly QuoteListItem[];
}

export function QuoteListTable({ quotes }: QuoteListTableProps) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quote #</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="hidden md:table-cell">Client</TableHead>
              <TableHead className="hidden lg:table-cell">Deal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Valid Until</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotes.map((quote) => (
              <TableRow key={quote.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-medium">
                  <Link href={`/sales/quotes/${quote.id}`} className="hover:underline">
                    {quote.quoteNumber}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/sales/quotes/${quote.id}`} className="block min-w-0">
                    <p className="truncate font-medium hover:underline">{quote.title}</p>
                    <p className="truncate text-xs text-muted-foreground md:hidden">
                      {quote.clientName}
                    </p>
                  </Link>
                </TableCell>
                <TableCell className="hidden max-w-[180px] truncate md:table-cell">
                  {quote.clientName}
                </TableCell>
                <TableCell className="hidden max-w-[180px] truncate lg:table-cell">
                  {quote.dealTitle}
                </TableCell>
                <TableCell>
                  <QuoteStatusBadge status={quote.status} />
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {formatQuoteDate(quote.validUntil)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatQuoteAmount(quote.totalAmount, quote.currency)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
