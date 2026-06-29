'use client';

import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MilestoneRowActionsProps {
  readonly milestoneName: string;
  readonly disabled?: boolean;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
}

export function MilestoneRowActions({
  milestoneName,
  disabled = false,
  onEdit,
  onDelete,
}: MilestoneRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          disabled={disabled}
          aria-label={`Actions for ${milestoneName}`}
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
