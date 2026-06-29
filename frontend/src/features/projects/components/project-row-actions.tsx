'use client';

import { Eye, MoreHorizontal } from 'lucide-react';
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
}

export function ProjectRowActions({ projectId, projectName }: ProjectRowActionsProps) {
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
