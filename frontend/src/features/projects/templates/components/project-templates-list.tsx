'use client';

import { LayoutTemplate, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState, ErrorState, LoadingState, StatusBadge, useToast } from '@/design-system';
import { TemplateFormDrawer } from '@/features/projects/templates/components/template-form-drawer';
import {
  PROJECT_SERVICE_TYPE_LABELS,
  type ProjectTemplateRecord,
} from '@/features/projects/templates/api/template.types';
import { useDeleteProjectTemplate } from '@/features/projects/templates/hooks/use-project-template-mutations';
import { useProjectTemplates } from '@/features/projects/templates/hooks/use-project-templates';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { Can } from '@/lib/rbac';

export function ProjectTemplatesList() {
  const { showToast } = useToast();
  const { data, isLoading, error, refetch } = useProjectTemplates({ take: 100 });
  const { mutateAsync: deleteTemplate, isPending: isDeleting } = useDeleteProjectTemplate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);

  const templates = data?.items ?? [];
  const activeTemplate = useMemo(
    () => templates.find((template) => template.id === activeTemplateId),
    [activeTemplateId, templates],
  );

  const openCreate = (): void => {
    setDrawerMode('create');
    setActiveTemplateId(null);
    setDrawerOpen(true);
  };

  const openEdit = (template: ProjectTemplateRecord): void => {
    setDrawerMode('edit');
    setActiveTemplateId(template.id);
    setDrawerOpen(true);
  };

  const handleDelete = async (template: ProjectTemplateRecord): Promise<void> => {
    try {
      await deleteTemplate(template.id);
      showToast('Template deleted');
    } catch (deleteError) {
      showToast(extractApiErrorMessage(deleteError), 'error');
    }
  };

  if (isLoading) {
    return <LoadingState label="Loading templates..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={extractApiErrorMessage(error)}
        action={
          <Button variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Reusable delivery blueprints with milestones and tasks.
        </p>
        <Can permission="projects.create">
          <Button type="button" className="gap-2" onClick={openCreate}>
            <Plus className="size-4" />
            New template
          </Button>
        </Can>
      </div>

      {templates.length === 0 ? (
        <EmptyState
          icon={LayoutTemplate}
          title="No templates yet"
          description="Create a template to standardize delivery for a service type."
          action={
            <Can permission="projects.create">
              <Button type="button" className="gap-2" onClick={openCreate}>
                <Plus className="size-4" />
                New template
              </Button>
            </Can>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Milestones</TableHead>
                <TableHead>Tasks</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell>{PROJECT_SERVICE_TYPE_LABELS[template.serviceType]}</TableCell>
                  <TableCell>
                    {template.defaultDurationDays !== null
                      ? `${String(template.defaultDurationDays)}d`
                      : '—'}
                  </TableCell>
                  <TableCell>{template.milestones.length}</TableCell>
                  <TableCell>{template.tasks.length}</TableCell>
                  <TableCell>
                    <StatusBadge variant={template.isActive ? 'success' : 'neutral'}>
                      {template.isActive ? 'Active' : 'Inactive'}
                    </StatusBadge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Can permission="projects.create">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            openEdit(template);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isDeleting}
                          onClick={() => {
                            void handleDelete(template);
                          }}
                        >
                          Delete
                        </Button>
                      </Can>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <TemplateFormDrawer
        open={drawerOpen}
        mode={drawerMode}
        template={activeTemplate}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
