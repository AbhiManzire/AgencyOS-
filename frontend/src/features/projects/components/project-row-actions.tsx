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

interface ProjectRowActionsProps {
  readonly projectId: string;
  readonly projectName: string;
  readonly isArchived: boolean;
  readonly onEdit: (projectId: string) => void;
  readonly onArchive: (projectId: string) => void;
  readonly onRestore: (projectId: string) => void;
}

export function ProjectRowActions({
  projectId,
  projectName,
  isArchived,
  onEdit,
  onArchive,
  onRestore,
}: ProjectRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label={`Actions for ${projectName}`}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <Can permission="projects.read">
          <DropdownMenuItem asChild className="gap-2">
            <Link href={`/projects/${projectId}`}>
              <Eye className="size-4" />
              View
            </Link>
          </DropdownMenuItem>
        </Can>
        <Can permission="projects.update" mode="disable">
          <DropdownMenuItem
            disabled={isArchived}
            className="gap-2"
            onSelect={() => {
              onEdit(projectId);
            }}
          >
            <Pencil className="size-4" />
            Edit
          </DropdownMenuItem>
        </Can>
        {isArchived ? (
          <Can permission="projects.update" mode="disable">
            <DropdownMenuItem
              className="gap-2"
              onSelect={() => {
                onRestore(projectId);
              }}
            >
              <RotateCcw className="size-4" />
              Restore
            </DropdownMenuItem>
          </Can>
        ) : (
          <Can permission="projects.update" mode="disable">
            <DropdownMenuItem
              className="gap-2 text-danger focus:text-danger"
              onSelect={() => {
                onArchive(projectId);
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
