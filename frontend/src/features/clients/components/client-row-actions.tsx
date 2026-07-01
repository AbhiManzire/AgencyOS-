'use client';

import { Archive, MoreHorizontal, Pencil, RotateCcw, Eye } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Can } from '@/lib/rbac';

interface ClientRowActionsProps {
  readonly clientId: string;
  readonly clientName: string;
  readonly isArchived: boolean;
  readonly onEdit: (clientId: string) => void;
  readonly onArchive: (clientId: string) => void;
  readonly onRestore: (clientId: string) => void;
}

export function ClientRowActions({
  clientId,
  clientName,
  isArchived,
  onEdit,
  onArchive,
  onRestore,
}: ClientRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label={`Actions for ${clientName}`}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <Can permission="clients.read">
          <DropdownMenuItem asChild>
            <Link href={`/clients/${clientId}`} className="gap-2">
              <Eye className="size-4" />
              View
            </Link>
          </DropdownMenuItem>
        </Can>
        <Can permission="clients.update" mode="disable">
          <DropdownMenuItem
            disabled={isArchived}
            className="gap-2"
            onSelect={() => {
              onEdit(clientId);
            }}
          >
            <Pencil className="size-4" />
            Edit
          </DropdownMenuItem>
        </Can>
        {isArchived ? (
          <Can permission="clients.restore" mode="disable">
            <DropdownMenuItem
              className="gap-2"
              onSelect={() => {
                onRestore(clientId);
              }}
            >
              <RotateCcw className="size-4" />
              Restore
            </DropdownMenuItem>
          </Can>
        ) : (
          <Can permission="clients.archive" mode="disable">
            <DropdownMenuItem
              className="gap-2 text-danger focus:text-danger"
              onSelect={() => {
                onArchive(clientId);
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
