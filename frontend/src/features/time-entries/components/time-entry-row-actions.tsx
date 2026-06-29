'use client';

import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TimeEntryRowActionsProps {
  readonly disabled?: boolean;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
}

export function TimeEntryRowActions({
  disabled = false,
  onEdit,
  onDelete,
}: TimeEntryRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          disabled={disabled}
          aria-label="Time entry actions"
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          disabled={disabled}
          className="gap-2"
          onSelect={() => {
            onEdit();
          }}
        >
          <Pencil className="size-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={disabled}
          className="gap-2 text-danger focus:text-danger"
          onSelect={() => {
            onDelete();
          }}
        >
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
