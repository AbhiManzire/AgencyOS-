'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';
import { Caption } from '@/design-system';

interface LeadListPaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function LeadListPagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: LeadListPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
      <Caption>
        Showing {start}–{end} of {totalItems}
      </Caption>

      <div className="flex flex-wrap items-center gap-2">
        <NativeSelect
          label="Rows per page"
          value={String(pageSize)}
          onChange={(event) => {
            onPageSizeChange(Number(event.target.value));
          }}
          className="min-w-[120px]"
        >
          <option value="5">5 / page</option>
          <option value="10">10 / page</option>
          <option value="25">25 / page</option>
        </NativeSelect>

        <Button
          variant="outline"
          size="icon"
          disabled={page <= 1}
          onClick={() => {
            onPageChange(page - 1);
          }}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </Button>

        <Caption className="min-w-[80px] text-center">
          Page {page} of {totalPages}
        </Caption>

        <Button
          variant="outline"
          size="icon"
          disabled={page >= totalPages}
          onClick={() => {
            onPageChange(page + 1);
          }}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
