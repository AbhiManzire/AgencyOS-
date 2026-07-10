'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ProjectRowActions } from '@/features/projects/components/project-row-actions';
import { ProjectStatusBadge } from '@/features/projects/components/project-status-badge';
import { SortIndicator } from '@/features/projects/components/project-list-toolbar';
import type { ProjectListItem, ProjectSortField, SortDirection } from '@/features/projects/types';

interface ProjectListTableProps {
  projects: readonly ProjectListItem[];
  sortField: ProjectSortField;
  sortDirection: SortDirection;
  onSortFieldChange: (field: ProjectSortField) => void;
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

const PRIORITY_LABELS: Record<ProjectListItem['priority'], string> = {
  LOW: 'Low',
  NORMAL: 'Normal',
  HIGH: 'High',
  URGENT: 'Urgent',
};

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

export function ProjectListTable({
  projects,
  sortField,
  sortDirection,
  onSortFieldChange,
}: ProjectListTableProps) {
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
              <TableRow key={project.id}>
                <TableCell>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{project.name}</p>
                    <p className="truncate text-xs text-muted-foreground md:hidden">
                      {project.clientName}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="hidden max-w-[200px] truncate md:table-cell">
                  {project.clientName}
                </TableCell>
                <TableCell className="hidden lg:table-cell">{project.code}</TableCell>
                <TableCell>
                  <ProjectStatusBadge status={project.status} />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {PRIORITY_LABELS[project.priority]}
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  {formatDate(project.targetEndDate)}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {formatDate(project.updatedAt)}
                </TableCell>
                <TableCell className="text-right">
                  <ProjectRowActions
                    projectId={project.id}
                    projectName={project.name}
                    canArchive={project.status !== 'CANCELLED'}
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

/** Compact card list for narrow viewports. */
export function ProjectListMobileCards({ projects }: { projects: readonly ProjectListItem[] }) {
  return (
    <div className="space-y-3 md:hidden">
      {projects.map((project) => (
        <div key={project.id} className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-2">
              <div>
                <p className="font-medium text-foreground">{project.name}</p>
                <p className="text-sm text-muted-foreground">{project.clientName}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <ProjectStatusBadge status={project.status} />
                <span className="text-xs text-muted-foreground">
                  {PRIORITY_LABELS[project.priority]}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Target end: {formatDate(project.targetEndDate)}
              </p>
            </div>
            <ProjectRowActions
              projectId={project.id}
              projectName={project.name}
              canArchive={project.status !== 'CANCELLED'}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
