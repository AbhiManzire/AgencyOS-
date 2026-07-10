'use client';

import { Archive, Eye, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/design-system';
import { ArchiveProjectDialog } from '@/features/projects/components/archive-project-dialog';
import { useArchiveProject } from '@/features/projects/hooks/use-archive-project';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { Can } from '@/lib/rbac';

interface ProjectRowActionsProps {
  readonly projectId: string;
  readonly projectName: string;
  readonly canArchive?: boolean;
}

export function ProjectRowActions({
  projectId,
  projectName,
  canArchive = true,
}: ProjectRowActionsProps) {
  const { showToast } = useToast();
  const [archiveOpen, setArchiveOpen] = useState(false);
  const { mutateAsync: archiveProject, isPending: isArchiving } = useArchiveProject();

  const handleConfirmArchive = async (): Promise<void> => {
    try {
      await archiveProject(projectId);
      showToast('Project archived successfully');
      setArchiveOpen(false);
    } catch (archiveError) {
      showToast(extractApiErrorMessage(archiveError), 'error');
    }
  };

  return (
    <>
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
          {canArchive ? (
            <Can permission="projects.update">
              <DropdownMenuItem
                className="gap-2 text-danger"
                onSelect={() => {
                  setArchiveOpen(true);
                }}
              >
                <Archive className="size-4" />
                Archive
              </DropdownMenuItem>
            </Can>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <ArchiveProjectDialog
        open={archiveOpen}
        isPending={isArchiving}
        onCancel={() => {
          setArchiveOpen(false);
        }}
        onConfirm={() => {
          void handleConfirmArchive();
        }}
      />
    </>
  );
}
