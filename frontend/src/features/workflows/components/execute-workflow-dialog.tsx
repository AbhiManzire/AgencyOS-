'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useState, type SyntheticEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { SectionTitle, useToast } from '@/design-system';
import { useExecuteWorkflow } from '@/features/workflows/hooks/use-workflow-mutations';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

const TEXTAREA_CLASS =
  'flex w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

interface ExecuteWorkflowDialogProps {
  readonly open: boolean;
  readonly workflowId: string | null;
  readonly workflowName?: string;
  readonly onOpenChange: (open: boolean) => void;
}

/** Manual workflow execute sheet with optional JSON payload. */
export function ExecuteWorkflowDialog({
  open,
  workflowId,
  workflowName,
  onOpenChange,
}: ExecuteWorkflowDialogProps) {
  const { showToast } = useToast();
  const executeMutation = useExecuteWorkflow();
  const [payloadText, setPayloadText] = useState('{\n  \n}');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setPayloadText('{\n  \n}');
    setError(null);
  }, [open, workflowId]);

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!workflowId) {
      return;
    }

    let payload: Record<string, unknown> | undefined;
    const trimmed = payloadText.trim();
    if (trimmed.length > 0 && trimmed !== '{}') {
      try {
        const parsed: unknown = JSON.parse(trimmed);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          setError('Payload must be a JSON object');
          return;
        }
        payload = parsed as Record<string, unknown>;
      } catch {
        setError('Invalid JSON payload');
        return;
      }
    }

    try {
      await executeMutation.mutateAsync({
        workflowId,
        payload: payload ? { payload, triggerPayload: payload } : {},
      });
      showToast('Workflow execution queued', 'success');
      onOpenChange(false);
    } catch (err) {
      setError(extractApiErrorMessage(err));
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <form className="flex h-full flex-col" onSubmit={(event) => void handleSubmit(event)}>
          <div className="space-y-4 pb-6">
            <SectionTitle>Execute workflow</SectionTitle>
            <p className="text-sm text-muted-foreground">
              Run {workflowName ?? 'this workflow'} manually with an optional trigger payload.
            </p>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <div className="space-y-2">
              <label htmlFor="execute-payload" className="text-sm font-medium">
                Payload (JSON)
              </label>
              <textarea
                id="execute-payload"
                rows={12}
                value={payloadText}
                disabled={executeMutation.isPending}
                className={TEXTAREA_CLASS}
                onChange={(event) => {
                  setPayloadText(event.target.value);
                  setError(null);
                }}
              />
            </div>
          </div>
          <div className="mt-auto flex justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={executeMutation.isPending}
              onClick={() => {
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={executeMutation.isPending || !workflowId}
              className="gap-2"
            >
              {executeMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Execute
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
