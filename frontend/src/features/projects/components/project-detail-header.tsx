'use client';

import { Archive, CheckCircle2, FileText, Pencil, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { Body, Caption } from '@/design-system';
import { Button } from '@/components/ui/button';
import type { ProjectRecord } from '@/features/projects/api/project.types';
import { ProjectArchivedBadge } from '@/features/projects/components/project-archived-badge';
import { ProjectPriorityBadge } from '@/features/projects/components/project-priority-badge';
import { ProjectStatusBadge } from '@/features/projects/components/project-status-badge';
import { useProjectWorkspaceOwners } from '@/features/projects/hooks/use-project-meta';
import { displayProjectField, formatProjectDate } from '@/features/projects/utils/project-display';
import { isProjectArchived } from '@/features/projects/utils/list-projects-query';
import { Can } from '@/lib/rbac';

interface ProjectDetailHeaderProps {
  readonly project: ProjectRecord;
  readonly clientName: string;
  readonly onEdit: () => void;
  readonly onComplete: () => void;
  readonly onInvoiceReady: () => void;
  readonly onArchive: () => void;
  readonly onRestore: () => void;
  readonly isCompletePending?: boolean;
  readonly isInvoiceReadyPending?: boolean;
  readonly isRestorePending?: boolean;
}

export function ProjectDetailHeader({
  project,
  clientName,
  onEdit,
  onComplete,
  onInvoiceReady,
  onArchive,
  onRestore,
  isCompletePending = false,
  isInvoiceReadyPending = false,
  isRestorePending = false,
}: ProjectDetailHeaderProps) {
  const { data: owners = [] } = useProjectWorkspaceOwners();
  const ownerLabel = useMemo(() => {
    if (project.projectManagerUserId === null) {
      return '—';
    }

    return (
      owners.find((owner) => owner.id === project.projectManagerUserId)?.displayName ??
      displayProjectField(project.projectManagerUserId)
    );
  }, [owners, project.projectManagerUserId]);

  const archived = isProjectArchived(project);
  const canComplete = !archived && project.status === 'ACTIVE';
  const canInvoiceReady = !archived && project.status === 'COMPLETED' && project.isBillable;
  const canArchive = !archived && project.status !== 'CANCELLED';

  return (
    <div className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-start md:justify-between">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1
            className={
              archived
                ? 'text-2xl font-semibold tracking-tight text-muted-foreground md:text-3xl'
                : 'text-2xl font-semibold tracking-tight text-foreground md:text-3xl'
            }
          >
            {project.name}
          </h1>
          <ProjectStatusBadge status={project.status} />
          <ProjectPriorityBadge priority={project.priority} />
          {archived ? <ProjectArchivedBadge /> : null}
        </div>

        <div className="flex flex-wrap gap-x-8 gap-y-2">
          <div>
            <Caption className="block uppercase tracking-wide">Project Code</Caption>
            <Body className="font-mono text-muted-foreground">
              {displayProjectField(project.code)}
            </Body>
          </div>
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
            <Caption className="block uppercase tracking-wide">Owner</Caption>
            <Body className="text-muted-foreground">{ownerLabel}</Body>
          </div>
          <div>
            <Caption className="block uppercase tracking-wide">Created</Caption>
            <Body className="text-muted-foreground">{formatProjectDate(project.createdAt)}</Body>
          </div>
          <div>
            <Caption className="block uppercase tracking-wide">Updated</Caption>
            <Body className="text-muted-foreground">{formatProjectDate(project.updatedAt)}</Body>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Can permission="projects.update" mode="disable">
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            disabled={archived}
            onClick={onEdit}
          >
            <Pencil className="size-4" />
            Edit
          </Button>
        </Can>

        {canComplete ? (
          <Can permission="projects.update" mode="disable">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              disabled={isCompletePending}
              onClick={onComplete}
            >
              <CheckCircle2 className="size-4" />
              Complete
            </Button>
          </Can>
        ) : null}

        {canInvoiceReady ? (
          <Can permission="projects.update" mode="disable">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              disabled={isInvoiceReadyPending}
              onClick={onInvoiceReady}
            >
              <FileText className="size-4" />
              Invoice Ready
            </Button>
          </Can>
        ) : null}

        {archived ? (
          <Can permission="projects.update" mode="disable">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              disabled={isRestorePending}
              onClick={onRestore}
            >
              <RotateCcw className="size-4" />
              Restore
            </Button>
          </Can>
        ) : canArchive ? (
          <Can permission="projects.update" mode="disable">
            <Button
              type="button"
              variant="outline"
              className="gap-2 text-danger"
              onClick={onArchive}
            >
              <Archive className="size-4" />
              Archive
            </Button>
          </Can>
        ) : null}
      </div>
    </div>
  );
}
