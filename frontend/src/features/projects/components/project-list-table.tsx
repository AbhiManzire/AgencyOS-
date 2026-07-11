'use client';

import { useRouter } from 'next/navigation';
import type { SyntheticEvent } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ProjectArchivedBadge } from '@/features/projects/components/project-archived-badge';
import { ProjectPriorityBadge } from '@/features/projects/components/project-priority-badge';
import { ProjectRowActions } from '@/features/projects/components/project-row-actions';
import { ProjectStatusBadge } from '@/features/projects/components/project-status-badge';
import { SortIndicator } from '@/features/projects/components/project-list-toolbar';
import type { ProjectListItem, ProjectSortField, SortDirection } from '@/features/projects/types';
import { cn } from '@/lib/utils';

interface ProjectListTableProps {
  projects: readonly ProjectListItem[];
  sortField: ProjectSortField;
  sortDirection: SortDirection;
  onSortFieldChange: (field: ProjectSortField) => void;
  onEditProject: (projectId: string) => void;
  onArchiveProject: (projectId: string) => void;
  onRestoreProject: (projectId: string) => void;
}

interface SortableHeaderProps {
  label: string;
  field: ProjectSortField;
  activeField: ProjectSortField;
  direction: SortDirection;
  onSort: (field: ProjectSortField) => void;
  className?: string;
}

function SortableHeader({
  label,
  field,
  activeField,
  direction,
  onSort,
  className,
}: SortableHeaderProps) {
  const isActive = activeField === field;

  return (
    <TableHead className={className}>
      <button
        type="button"
        className="ds-focus-ring inline-flex items-center rounded-sm hover:text-foreground"
        onClick={() => {
          onSort(field);
        }}
      >
        {label}
        <SortIndicator direction={isActive ? direction : null} />
      </button>
    </TableHead>
  );
}

function formatDate(isoDate: string | null): string {
  if (isoDate === null) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(isoDate));
}

function stopRowNavigation(event: SyntheticEvent): void {
  event.stopPropagation();
}

export function ProjectListTable({
  projects,
  sortField,
  sortDirection,
  onSortFieldChange,
  onEditProject,
  onArchiveProject,
  onRestoreProject,
}: ProjectListTableProps) {
  const router = useRouter();

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="max-h-[min(70vh,640px)] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card shadow-sm">
            <TableRow>
              <SortableHeader
                label="Project"
                field="name"
                activeField={sortField}
                direction={sortDirection}
                onSort={onSortFieldChange}
              />
              <TableHead className="hidden md:table-cell">Client</TableHead>
              <TableHead className="hidden lg:table-cell">Code</TableHead>
              <TableHead className="hidden xl:table-cell">Owner</TableHead>
              <SortableHeader
                label="Status"
                field="status"
                activeField={sortField}
                direction={sortDirection}
                onSort={onSortFieldChange}
              />
              <SortableHeader
                label="Priority"
                field="priority"
                activeField={sortField}
                direction={sortDirection}
                onSort={onSortFieldChange}
                className="hidden lg:table-cell"
              />
              <SortableHeader
                label="Target End"
                field="targetEndDate"
                activeField={sortField}
                direction={sortDirection}
                onSort={onSortFieldChange}
                className="hidden xl:table-cell"
              />
              <SortableHeader
                label="Updated"
                field="updatedAt"
                activeField={sortField}
                direction={sortDirection}
                onSort={onSortFieldChange}
                className="hidden lg:table-cell"
              />
              <TableHead className="w-12 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow
                key={project.id}
                className={cn(
                  'cursor-pointer',
                  project.isArchived ? 'bg-muted/40 text-muted-foreground' : undefined,
                )}
                onClick={() => {
                  router.push(`/projects/${project.id}`);
                }}
              >
                <TableCell>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{project.name}</p>
                    <p className="truncate text-xs text-muted-foreground md:hidden">
                      {project.clientName}
                    </p>
                    {project.isArchived ? (
                      <div className="mt-1 md:hidden">
                        <ProjectArchivedBadge />
                      </div>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="hidden max-w-[200px] truncate md:table-cell">
                  {project.clientName}
                </TableCell>
                <TableCell className="hidden font-mono text-sm lg:table-cell">
                  {project.code}
                </TableCell>
                <TableCell className="hidden max-w-[160px] truncate xl:table-cell">
                  {project.projectManager}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-2">
                    <ProjectStatusBadge status={project.status} />
                    {project.isArchived ? (
                      <span className="hidden md:inline-flex">
                        <ProjectArchivedBadge />
                      </span>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <ProjectPriorityBadge priority={project.priority} />
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  {formatDate(project.targetEndDate)}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {formatDate(project.updatedAt)}
                </TableCell>
                <TableCell className="text-right" onClick={stopRowNavigation}>
                  <ProjectRowActions
                    projectId={project.id}
                    projectName={project.name}
                    isArchived={project.isArchived}
                    onEdit={onEditProject}
                    onArchive={onArchiveProject}
                    onRestore={onRestoreProject}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

interface ProjectListMobileCardsProps {
  readonly projects: readonly ProjectListItem[];
  readonly onEditProject: (projectId: string) => void;
  readonly onArchiveProject: (projectId: string) => void;
  readonly onRestoreProject: (projectId: string) => void;
}

/** Compact card list for narrow viewports. */
export function ProjectListMobileCards({
  projects,
  onEditProject,
  onArchiveProject,
  onRestoreProject,
}: ProjectListMobileCardsProps) {
  const router = useRouter();

  return (
    <div className="space-y-3 md:hidden">
      {projects.map((project) => (
        <div
          key={project.id}
          role="button"
          tabIndex={0}
          className={cn(
            'cursor-pointer rounded-lg border border-border bg-card p-4',
            project.isArchived ? 'bg-muted/40 text-muted-foreground' : undefined,
          )}
          onClick={() => {
            router.push(`/projects/${project.id}`);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              router.push(`/projects/${project.id}`);
            }
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-2">
              <div>
                <p className="font-medium text-foreground">{project.name}</p>
                <p className="text-sm text-muted-foreground">{project.clientName}</p>
                <p className="font-mono text-xs text-muted-foreground">{project.code}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <ProjectStatusBadge status={project.status} />
                <ProjectPriorityBadge priority={project.priority} />
                {project.isArchived ? <ProjectArchivedBadge /> : null}
              </div>
              <p className="text-sm text-muted-foreground">Owner: {project.projectManager}</p>
              <p className="text-sm text-muted-foreground">
                Target end: {formatDate(project.targetEndDate)}
              </p>
            </div>
            <div onClick={stopRowNavigation} onKeyDown={stopRowNavigation}>
              <ProjectRowActions
                projectId={project.id}
                projectName={project.name}
                isArchived={project.isArchived}
                onEdit={onEditProject}
                onArchive={onArchiveProject}
                onRestore={onRestoreProject}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
