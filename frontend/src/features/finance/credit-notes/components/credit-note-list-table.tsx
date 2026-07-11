'use client';

import { Ban, MoreHorizontal, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CreditNoteStatusBadge } from '@/features/finance/credit-notes/components/credit-note-status-badge';
import {
  formatCreditNoteAmount,
  formatCreditNoteDate,
} from '@/features/finance/credit-notes/forms/credit-note-form.validation';
import type { CreditNoteListItem } from '@/features/finance/credit-notes/types';

interface CreditNoteListTableProps {
  readonly notes: readonly CreditNoteListItem[];
  readonly canManage?: boolean;
  readonly onApply?: (note: CreditNoteListItem) => void;
  readonly onVoid?: (note: CreditNoteListItem) => void;
}

export function CreditNoteListTable({
  notes,
  canManage = false,
  onApply,
  onVoid,
}: CreditNoteListTableProps) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Credit Note #</TableHead>
              <TableHead className="hidden md:table-cell">Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Issue Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="hidden md:table-cell text-right">Remaining</TableHead>
              {canManage ? <TableHead className="w-12 text-right">Actions</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {notes.map((note) => {
              const canApply =
                note.status !== 'VOID' && note.status !== 'DRAFT' && note.remainingAmount > 0;
              const canVoid = note.status !== 'VOID';

              return (
                <TableRow key={note.id}>
                  <TableCell className="font-medium">{note.creditNoteNumber}</TableCell>
                  <TableCell className="hidden max-w-[180px] truncate md:table-cell">
                    {note.clientName.length > 0 ? note.clientName : '—'}
                  </TableCell>
                  <TableCell>
                    <CreditNoteStatusBadge status={note.status} />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {formatCreditNoteDate(note.issueDate)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCreditNoteAmount(note.amount, note.currency)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-right">
                    {formatCreditNoteAmount(note.remainingAmount, note.currency)}
                  </TableCell>
                  {canManage ? (
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label={`Actions for ${note.creditNoteNumber}`}
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            disabled={!canApply}
                            className="gap-2"
                            onSelect={() => {
                              onApply?.(note);
                            }}
                          >
                            <Receipt className="size-4" />
                            Apply to invoice
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            disabled={!canVoid}
                            className="gap-2 text-danger focus:text-danger"
                            onSelect={() => {
                              onVoid?.(note);
                            }}
                          >
                            <Ban className="size-4" />
                            Void
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  ) : null}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
