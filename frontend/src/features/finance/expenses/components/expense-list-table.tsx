'use client';

import { Archive, Check, MoreHorizontal, Pencil, X } from 'lucide-react';
import type { SyntheticEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { StatusBadge } from '@/design-system';
import type { ExpenseRecord } from '@/features/finance/expenses/api/expense.types';
import { ExpenseStatusBadge } from '@/features/finance/expenses/components/expense-status-badge';
import {
  formatExpenseAmount,
  formatExpenseDate,
  isExpenseArchived,
} from '@/features/finance/expenses/forms/expense-form.validation';
import { Can } from '@/lib/rbac';
import { cn } from '@/lib/utils';

type VendorNameLookup = Readonly<Record<string, string>>;

interface ExpenseListTableProps {
  readonly expenses: readonly ExpenseRecord[];
  readonly vendorNames?: VendorNameLookup;
  readonly onEdit: (expenseId: string) => void;
  readonly onArchive: (expenseId: string) => void;
  readonly onApprove: (expenseId: string) => void;
  readonly onReject: (expenseId: string) => void;
  readonly actionPendingId?: string | null;
}

function stopRowNavigation(event: SyntheticEvent): void {
  event.stopPropagation();
}

export function ExpenseListTable({
  expenses,
  vendorNames = {},
  onEdit,
  onArchive,
  onApprove,
  onReject,
  actionPendingId = null,
}: ExpenseListTableProps) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead className="hidden md:table-cell">Vendor</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="hidden sm:table-cell">Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => {
              const archived = isExpenseArchived(expense);
              const canDecide = !archived && expense.approvalStatus === 'PENDING';
              const vendorLabel =
                expense.vendorId !== null ? (vendorNames[expense.vendorId] ?? '—') : '—';

              return (
                <TableRow
                  key={expense.id}
                  className={cn(archived ? 'text-muted-foreground' : undefined)}
                >
                  <TableCell>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{expense.category}</p>
                      {expense.description ? (
                        <p className="truncate text-xs text-muted-foreground">
                          {expense.description}
                        </p>
                      ) : null}
                      {archived ? (
                        <span className="mt-1 inline-block">
                          <StatusBadge variant="neutral">Archived</StatusBadge>
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="hidden max-w-[160px] truncate md:table-cell">
                    {vendorLabel}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-medium">
                    {formatExpenseAmount(expense.amount, expense.currency)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {formatExpenseDate(expense.expenseDate)}
                  </TableCell>
                  <TableCell>
                    <ExpenseStatusBadge status={expense.approvalStatus} />
                  </TableCell>
                  <TableCell
                    className="text-right"
                    onClick={stopRowNavigation}
                    onKeyDown={stopRowNavigation}
                  >
                    <div className="flex items-center justify-end gap-1">
                      {canDecide ? (
                        <Can permission="finance.expenses.update" mode="hide">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Approve expense"
                            disabled={actionPendingId === expense.id}
                            onClick={() => {
                              onApprove(expense.id);
                            }}
                          >
                            <Check className="size-4 text-success" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Reject expense"
                            disabled={actionPendingId === expense.id}
                            onClick={() => {
                              onReject(expense.id);
                            }}
                          >
                            <X className="size-4 text-danger" />
                          </Button>
                        </Can>
                      ) : null}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Expense actions"
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!archived ? (
                            <Can permission="finance.expenses.update" mode="hide">
                              <DropdownMenuItem
                                onSelect={() => {
                                  onEdit(expense.id);
                                }}
                              >
                                <Pencil className="mr-2 size-4" />
                                Edit
                              </DropdownMenuItem>
                            </Can>
                          ) : null}
                          {!archived ? (
                            <Can permission="finance.expenses.update" mode="hide">
                              <DropdownMenuItem
                                className="text-danger focus:text-danger"
                                onSelect={() => {
                                  onArchive(expense.id);
                                }}
                              >
                                <Archive className="mr-2 size-4" />
                                Archive
                              </DropdownMenuItem>
                            </Can>
                          ) : null}
                          {canDecide ? (
                            <Can permission="finance.expenses.update" mode="hide">
                              <DropdownMenuItem
                                onSelect={() => {
                                  onApprove(expense.id);
                                }}
                              >
                                <Check className="mr-2 size-4" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-danger focus:text-danger"
                                onSelect={() => {
                                  onReject(expense.id);
                                }}
                              >
                                <X className="mr-2 size-4" />
                                Reject
                              </DropdownMenuItem>
                            </Can>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
