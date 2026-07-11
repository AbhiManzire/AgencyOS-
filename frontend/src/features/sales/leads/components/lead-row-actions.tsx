'use client';

import { MoreHorizontal, Pencil, Archive, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Can } from '@/lib/rbac';

interface LeadRowActionsProps {
  readonly isArchived: boolean;
  readonly isConverted: boolean;
  readonly onEdit: () => void;
  readonly onArchive: () => void;
  readonly onRestore: () => void;
}

export function LeadRowActions({
  isArchived,
  isConverted,
  onEdit,
  onArchive,
  onRestore,
}: LeadRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Lead actions"
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
        {!isArchived && !isConverted ? (
          <Can permission="sales.update" mode="hide">
            <DropdownMenuItem
              onSelect={() => {
                onEdit();
              }}
            >
              <Pencil className="mr-2 size-4" />
              Edit
            </DropdownMenuItem>
          </Can>
        ) : null}
        {isArchived ? (
          <Can permission="sales.update" mode="hide">
            <DropdownMenuItem
              onSelect={() => {
                onRestore();
              }}
            >
              <RotateCcw className="mr-2 size-4" />
              Restore
            </DropdownMenuItem>
          </Can>
        ) : (
          <Can permission="sales.update" mode="hide">
            <DropdownMenuItem
              className="text-danger focus:text-danger"
              onSelect={() => {
                onArchive();
              }}
            >
              <Archive className="mr-2 size-4" />
              Archive
            </DropdownMenuItem>
          </Can>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
