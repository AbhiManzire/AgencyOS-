'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/design-system';
import { Body, Caption, CardTitle } from '@/design-system/typography';
import type { ProjectRecord } from '@/features/projects/api/project.types';
import { ProjectPriorityBadge } from '@/features/projects/components/project-priority-badge';
import { PROJECT_PRIORITY_LABELS } from '@/features/projects/forms/create-project.validation';
import {
  useProjectDepartments,
  useProjectWorkspaceOwners,
} from '@/features/projects/hooks/use-project-meta';
import { ProjectTagsPanel } from '@/features/projects/tags/components/project-tags-panel';
import {
  displayProjectField,
  formatProjectBillable,
  formatProjectDate,
} from '@/features/projects/utils/project-display';

interface ProjectDetailOverviewCardProps {
  readonly project: ProjectRecord;
  readonly clientName: string;
}

interface OverviewFieldProps {
  readonly label: string;
  readonly value: string;
  readonly mono?: boolean;
}

function OverviewField({ label, value, mono = false }: OverviewFieldProps) {
  return (
    <div className="space-y-1">
      <Caption className="block uppercase tracking-wide">{label}</Caption>
      <Body className={mono ? 'font-mono' : undefined}>{value}</Body>
    </div>
  );
}

function formatAmount(value: number | null): string {
  if (value === null) {
    return '—';
  }

  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function ProjectDetailOverviewCard({ project, clientName }: ProjectDetailOverviewCardProps) {
  const { data: owners = [] } = useProjectWorkspaceOwners();
  const { data: departments = [] } = useProjectDepartments();

  const ownerName = useMemo(() => {
    if (project.projectManagerUserId === null) {
      return '—';
    }

    return (
      owners.find((owner) => owner.id === project.projectManagerUserId)?.displayName ??
      displayProjectField(project.projectManagerUserId)
    );
  }, [owners, project.projectManagerUserId]);

  const departmentName = useMemo(() => {
    if (project.departmentId === null) {
      return '—';
    }

    return (
      departments.find((department) => department.id === project.departmentId)?.name ??
      displayProjectField(project.departmentId)
    );
  }, [departments, project.departmentId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Caption className="mb-1 block uppercase tracking-wide">Description</Caption>
          <Body className="whitespace-pre-wrap text-muted-foreground">
            {displayProjectField(project.description)}
          </Body>
        </div>

        <section className="space-y-3">
          <Caption className="block font-medium uppercase tracking-wide text-foreground">
            Client
          </Caption>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Caption className="block uppercase tracking-wide">Name</Caption>
              <Body>
                <Link
                  href={`/clients/${project.clientId}`}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {clientName}
                </Link>
              </Body>
            </div>
            <OverviewField label="Department" value={departmentName} />
          </div>
        </section>

        <section className="space-y-3">
          <Caption className="block font-medium uppercase tracking-wide text-foreground">
            Owner
          </Caption>
          <div className="grid gap-4 sm:grid-cols-2">
            <OverviewField label="Project Owner" value={ownerName} />
            <div className="space-y-1">
              <Caption className="block uppercase tracking-wide">Priority</Caption>
              <div className="flex items-center gap-2">
                <ProjectPriorityBadge priority={project.priority} />
                <Body className="text-muted-foreground">
                  {PROJECT_PRIORITY_LABELS[project.priority]}
                </Body>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <Caption className="block font-medium uppercase tracking-wide text-foreground">
            Budget
          </Caption>
          <div className="grid gap-4 sm:grid-cols-2">
            <OverviewField label="Budget" value={formatAmount(project.budgetAmount)} />
            <OverviewField label="Billable" value={formatProjectBillable(project.isBillable)} />
            <OverviewField label="Estimated Hours" value={formatAmount(project.estimatedHours)} />
            <OverviewField label="Actual Hours" value={formatAmount(project.actualHours)} />
          </div>
        </section>

        <section className="space-y-3">
          <Caption className="block font-medium uppercase tracking-wide text-foreground">
            Timeline
          </Caption>
          <div className="grid gap-4 sm:grid-cols-2">
            <OverviewField label="Project Code" value={displayProjectField(project.code)} mono />
            <OverviewField label="Start Date" value={formatProjectDate(project.startDate)} />
            <OverviewField label="End Date" value={formatProjectDate(project.targetEndDate)} />
            <OverviewField label="Created" value={formatProjectDate(project.createdAt)} />
            <OverviewField label="Updated" value={formatProjectDate(project.updatedAt)} />
          </div>
        </section>

        <div>
          <Caption className="mb-2 block uppercase tracking-wide">Tags</Caption>
          <ProjectTagsPanel projectId={project.id} />
        </div>
      </CardContent>
    </Card>
  );
}
