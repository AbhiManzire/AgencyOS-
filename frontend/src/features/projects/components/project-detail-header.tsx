'use client';

import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { Body, Caption } from '@/design-system';
import { Button } from '@/components/ui/button';
import type { ProjectRecord } from '@/features/projects/api/project.types';
import { ProjectStatusBadge } from '@/features/projects/components/project-status-badge';
import { displayProjectField } from '@/features/projects/utils/project-display';
import { Can } from '@/lib/rbac';

interface ProjectDetailHeaderProps {
  readonly project: ProjectRecord;
  readonly clientName: string;
}

export function ProjectDetailHeader({ project, clientName }: ProjectDetailHeaderProps) {
  const managerLabel = displayProjectField(project.projectManagerUserId);

  return (
    <div className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-start md:justify-between">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {project.name}
          </h1>
          <ProjectStatusBadge status={project.status} />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:gap-8">
          <div>
            <Caption className="block uppercase tracking-wide">Client</Caption>
            <Body>
              <Link
                href={`/clients/${project.clientId}`}
                className="text-primary underline-offset-4 hover:underline"
              >
                {clientName}
              </Link>
            </Body>
          </div>
          <div>
            <Caption className="block uppercase tracking-wide">Project Manager</Caption>
            <Body className="text-muted-foreground">{managerLabel}</Body>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Can permission="projects.update" mode="disable">
          <Button type="button" variant="outline" disabled className="gap-2">
            <Pencil className="size-4" />
            Edit
          </Button>
        </Can>
      </div>
    </div>
  );
}
