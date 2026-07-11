'use client';

import { ArrowDown, ArrowUp, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
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
import { formatPurchaseBillAmount } from '@/features/finance/purchases/forms/purchase-bill-form.validation';
import type { PurchaseBillLineItemListItem } from '@/features/finance/purchases/types';

interface PurchaseLineItemTableProps {
  readonly lineItems: readonly PurchaseBillLineItemListItem[];
  readonly currency: string;
  readonly readOnly?: boolean;
  readonly isReordering?: boolean;
  readonly onEditLineItem: (lineItemId: string) => void;
  readonly onDeleteLineItem: (lineItemId: string) => void;
  readonly onMoveLineItem: (lineItemId: string, direction: 'up' | 'down') => void;
}

export function PurchaseLineItemTable({
  lineItems,
  currency,
  readOnly = false,
  isReordering = false,
  onEditLineItem,
  onDeleteLineItem,
  onMoveLineItem,
}: PurchaseLineItemTableProps) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Qty</TableHead>
              <TableHead className="hidden lg:table-cell">Unit</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="hidden sm:table-cell text-right">Discount</TableHead>
              <TableHead className="hidden sm:table-cell text-right">Tax</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-12 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lineItems.map((item, index) => (
              <TableRow key={item.id}>
                <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                <TableCell>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.name}</p>
                    {item.description ? (
                      <p className="truncate text-xs text-muted-foreground">{item.description}</p>
                    ) : null}
                    <p className="text-xs text-muted-foreground md:hidden">
                      {item.quantity}
                      {item.unit ? ` ${item.unit}` : ''}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{item.quantity}</TableCell>
                <TableCell className="hidden lg:table-cell">{item.unit ?? '—'}</TableCell>
                <TableCell className="text-right">
                  {formatPurchaseBillAmount(item.unitPrice, currency)}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-right">
                  {formatPurchaseBillAmount(item.discount, currency)}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-right">
                  {formatPurchaseBillAmount(item.tax, currency)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatPurchaseBillAmount(item.total, currency)}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        disabled={readOnly || isReordering}
                        aria-label={`Actions for ${item.name}`}
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        disabled={readOnly || isReordering || index === 0}
                        className="gap-2"
                        onSelect={() => {
                          onMoveLineItem(item.id, 'up');
                        }}
                      >
                        <ArrowUp className="size-4" />
                        Move up
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={readOnly || isReordering || index === lineItems.length - 1}
                        className="gap-2"
                        onSelect={() => {
                          onMoveLineItem(item.id, 'down');
                        }}
                      >
                        <ArrowDown className="size-4" />
                        Move down
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        disabled={readOnly || isReordering}
                        className="gap-2"
                        onSelect={() => {
                          onEditLineItem(item.id);
                        }}
                      >
                        <Pencil className="size-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={readOnly || isReordering}
                        className="gap-2 text-danger focus:text-danger"
                        onSelect={() => {
                          onDeleteLineItem(item.id);
                        }}
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
