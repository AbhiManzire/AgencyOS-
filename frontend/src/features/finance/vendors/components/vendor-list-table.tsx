'use client';

import { Archive, MoreHorizontal, Pencil, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
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
import type { VendorRecord } from '@/features/finance/vendors/api/vendor.types';
import { VendorArchivedBadge } from '@/features/finance/vendors/components/vendor-archived-badge';
import {
  formatVendorDate,
  isVendorArchived,
} from '@/features/finance/vendors/forms/vendor-form.validation';
import { Can } from '@/lib/rbac';
import { cn } from '@/lib/utils';

interface VendorListTableProps {
  readonly vendors: readonly VendorRecord[];
  readonly onEdit: (vendorId: string) => void;
  readonly onArchive: (vendorId: string) => void;
  readonly onRestore: (vendorId: string) => void;
}

function stopRowNavigation(event: SyntheticEvent): void {
  event.stopPropagation();
}

function display(value: string | null): string {
  if (value === null || value.trim().length === 0) {
    return '—';
  }
  return value;
}

export function VendorListTable({ vendors, onEdit, onArchive, onRestore }: VendorListTableProps) {
  const router = useRouter();

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Contact</TableHead>
              <TableHead className="hidden sm:table-cell">Email</TableHead>
              <TableHead className="hidden lg:table-cell">Phone</TableHead>
              <TableHead className="hidden lg:table-cell">Currency</TableHead>
              <TableHead className="hidden xl:table-cell">Updated</TableHead>
              <TableHead className="w-12 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.map((vendor) => {
              const archived = isVendorArchived(vendor);

              return (
                <TableRow
                  key={vendor.id}
                  className={cn('cursor-pointer', archived ? 'text-muted-foreground' : undefined)}
                  onClick={() => {
                    router.push(`/finance/vendors/${vendor.id}`);
                  }}
                >
                  <TableCell>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{vendor.name}</p>
                      {vendor.code ? (
                        <p className="truncate text-xs text-muted-foreground">{vendor.code}</p>
                      ) : null}
                      {archived ? (
                        <span className="mt-1 inline-block">
                          <VendorArchivedBadge />
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="hidden max-w-[160px] truncate md:table-cell">
                    {display(vendor.contactPerson)}
                  </TableCell>
                  <TableCell className="hidden max-w-[180px] truncate sm:table-cell">
                    {display(vendor.email)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{display(vendor.phone)}</TableCell>
                  <TableCell className="hidden lg:table-cell">{vendor.currency}</TableCell>
                  <TableCell className="hidden xl:table-cell">
                    {formatVendorDate(vendor.updatedAt)}
                  </TableCell>
                  <TableCell
                    className="text-right"
                    onClick={stopRowNavigation}
                    onKeyDown={stopRowNavigation}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Vendor actions"
                          onClick={(event) => {
                            event.stopPropagation();
                          }}
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        onClick={(event) => {
                          event.stopPropagation();
                        }}
                      >
                        {!archived ? (
                          <Can permission="finance.vendors.update" mode="hide">
                            <DropdownMenuItem
                              onSelect={() => {
                                onEdit(vendor.id);
                              }}
                            >
                              <Pencil className="mr-2 size-4" />
                              Edit
                            </DropdownMenuItem>
                          </Can>
                        ) : null}
                        {archived ? (
                          <Can permission="finance.vendors.update" mode="hide">
                            <DropdownMenuItem
                              onSelect={() => {
                                onRestore(vendor.id);
                              }}
                            >
                              <RotateCcw className="mr-2 size-4" />
                              Restore
                            </DropdownMenuItem>
                          </Can>
                        ) : (
                          <Can permission="finance.vendors.update" mode="hide">
                            <DropdownMenuItem
                              className="text-danger focus:text-danger"
                              onSelect={() => {
                                onArchive(vendor.id);
                              }}
                            >
                              <Archive className="mr-2 size-4" />
                              Archive
                            </DropdownMenuItem>
                          </Can>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
