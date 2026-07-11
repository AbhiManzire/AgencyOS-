'use client';

import { Archive, Eye, MoreHorizontal, Pencil, RotateCcw } from 'lucide-react';
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
  readonly isArchived: boolean;
  readonly disabled?: boolean;
  readonly onEdit: () => void;
  readonly onArchive: () => void;
  readonly onRestore: () => void;
}

export function TaskRowActions({
  taskId,
  taskTitle,
  isArchived,
  disabled = false,
  onEdit,
  onArchive,
  onRestore,
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
            disabled={disabled || isArchived}
            className="gap-2"
            onSelect={() => {
              onEdit();
            }}
          >
            <Pencil className="size-4" />
            Edit
          </DropdownMenuItem>
        </Can>
        {isArchived ? (
          <Can permission="tasks.update">
            <DropdownMenuItem
              disabled={disabled}
              className="gap-2"
              onSelect={() => {
                onRestore();
              }}
            >
              <RotateCcw className="size-4" />
              Restore
            </DropdownMenuItem>
          </Can>
        ) : (
          <Can permission="tasks.update">
            <DropdownMenuItem
              disabled={disabled}
              className="gap-2 text-danger focus:text-danger"
              onSelect={() => {
                onArchive();
              }}
            >
              <Archive className="size-4" />
              Archive
            </DropdownMenuItem>
          </Can>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
