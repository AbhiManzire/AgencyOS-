'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useState, type SyntheticEvent } from 'react';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';
import { SectionTitle } from '@/design-system/typography';
import { useProjectTemplates } from '@/features/projects/templates/hooks/use-project-templates';

interface WinDealDialogProps {
  readonly open: boolean;
  readonly isPending: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: (options: {
    createProject: boolean;
    createInvoice: boolean;
    templateId?: string;
  }) => void;
  readonly onOpenClientWorkspace?: () => void;
  readonly showOpenClientWorkspace?: boolean;
}

export function WinDealDialog({
  open,
  isPending,
  onCancel,
  onConfirm,
  onOpenClientWorkspace,
  showOpenClientWorkspace = false,
}: WinDealDialogProps) {
  const [createProject, setCreateProject] = useState(true);
  const [createInvoice, setCreateInvoice] = useState(false);
  const [templateId, setTemplateId] = useState('');
  const { data: templatesData } = useProjectTemplates(
    { take: 100, isActive: true },
    { enabled: open },
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setCreateProject(true);
    setCreateInvoice(false);
    setTemplateId('');
  }, [open]);

  if (!open) {
    return null;
  }

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onConfirm({
      createProject,
      createInvoice,
      ...(createProject && templateId.trim().length > 0 ? { templateId: templateId.trim() } : {}),
    });
  };

  const templates = templatesData?.items ?? [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-6">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="win-deal-title"
        className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg"
        onSubmit={handleSubmit}
      >
        <SectionTitle id="win-deal-title" className="mb-2 text-base">
          Mark deal as won?
        </SectionTitle>
        <p className="mb-2 text-sm text-muted-foreground">
          Winning activates Client Success for this client (status becomes Active) and can
          optionally create a project and invoice.
        </p>
        <p className="mb-4 text-sm text-muted-foreground">
          After winning, open the client workspace to review health, renewals, and documents.
        </p>

        <div className="mb-6 space-y-3">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={createProject}
              disabled={isPending}
              onChange={(event) => {
                setCreateProject(event.target.checked);
                if (!event.target.checked) {
                  setCreateInvoice(false);
                  setTemplateId('');
                }
              }}
            />
            Create project
          </label>
          {createProject ? (
            <div className="pl-6">
              <NativeSelect
                id="winDealTemplateId"
                label="Project template"
                value={templateId}
                disabled={isPending}
                onChange={(event) => {
                  setTemplateId(event.target.value);
                }}
              >
                <option value="">No template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </NativeSelect>
            </div>
          ) : null}
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={createInvoice}
              disabled={isPending || !createProject}
              onChange={(event) => {
                setCreateInvoice(event.target.checked);
              }}
            />
            Create invoice
          </label>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" disabled={isPending} onClick={onCancel}>
            Cancel
          </Button>
          {showOpenClientWorkspace && onOpenClientWorkspace ? (
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={onOpenClientWorkspace}
            >
              Open client workspace
            </Button>
          ) : null}
          <Button type="submit" disabled={isPending} className="gap-2">
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Win deal
          </Button>
        </div>
      </form>
    </div>
  );
}
