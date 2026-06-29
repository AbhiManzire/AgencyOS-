'use client';

import { Eye, MoreHorizontal, Pencil } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Can } from '@/lib/rbac';

interface TaskRowActionsProps {
  readonly taskId: string;
  readonly taskTitle: string;
  readonly disabled?: boolean;
  readonly onEdit: () => void;
}

export function TaskRowActions({
  taskId,
  taskTitle,
  disabled = false,
  onEdit,
}: TaskRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          disabled={disabled}
          aria-label={`Actions for ${taskTitle}`}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <Can permission="tasks.read">
          <DropdownMenuItem asChild className="gap-2">
            <Link href={`/tasks/${taskId}`}>
              <Eye className="size-4" />
              View
            </Link>
          </DropdownMenuItem>
        </Can>
        <Can permission="tasks.update">
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
        </Can>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
