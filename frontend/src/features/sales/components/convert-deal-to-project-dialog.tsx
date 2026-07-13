'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useState, type SyntheticEvent } from 'react';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';
import { SectionTitle } from '@/design-system/typography';
import { useProjectTemplates } from '@/features/projects/templates/hooks/use-project-templates';

interface ConvertDealToProjectDialogProps {
  readonly open: boolean;
  readonly isPending: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: (options: { templateId?: string }) => void;
}

export function ConvertDealToProjectDialog({
  open,
  isPending,
  onCancel,
  onConfirm,
}: ConvertDealToProjectDialogProps) {
  const [templateId, setTemplateId] = useState('');
  const { data: templatesData } = useProjectTemplates(
    { take: 100, isActive: true },
    { enabled: open },
  );

  useEffect(() => {
    if (open) {
      setTemplateId('');
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onConfirm(templateId.trim().length > 0 ? { templateId: templateId.trim() } : {});
  };

  const templates = templatesData?.items ?? [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-6">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="convert-deal-project-title"
        className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg"
        onSubmit={handleSubmit}
      >
        <SectionTitle id="convert-deal-project-title" className="mb-2 text-base">
          Convert deal to project?
        </SectionTitle>
        <p className="mb-4 text-sm text-muted-foreground">
          Optionally apply a delivery template when creating the project.
        </p>

        <div className="mb-6">
          <NativeSelect
            id="convertTemplateId"
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

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" disabled={isPending} onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} className="gap-2">
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Convert
          </Button>
        </div>
      </form>
    </div>
  );
}
