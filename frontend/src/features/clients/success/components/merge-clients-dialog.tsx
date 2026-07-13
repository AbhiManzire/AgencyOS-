'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useState, type SyntheticEvent } from 'react';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';
import { SectionTitle, useToast } from '@/design-system';
import { useClients } from '@/features/clients/hooks/use-clients';
import { useMergeClients } from '@/features/clients/success/hooks/use-client-success-mutations';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

interface MergeClientsDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly defaultTargetClientId?: string;
}

export function MergeClientsDialog({
  open,
  onOpenChange,
  defaultTargetClientId = '',
}: MergeClientsDialogProps) {
  const { showToast } = useToast();
  const { data } = useClients({ take: 100, skip: 0 }, { enabled: open });
  const { mutateAsync: mergeClients, isPending } = useMergeClients();

  const [sourceClientId, setSourceClientId] = useState('');
  const [targetClientId, setTargetClientId] = useState(defaultTargetClientId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setSourceClientId('');
    setTargetClientId(defaultTargetClientId);
    setError(null);
  }, [defaultTargetClientId, open]);

  if (!open) {
    return null;
  }

  const clients = data?.items ?? [];

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (sourceClientId.length === 0 || targetClientId.length === 0) {
      setError('Select both source and target clients');
      return;
    }
    if (sourceClientId === targetClientId) {
      setError('Source and target must be different clients');
      return;
    }

    try {
      await mergeClients({ sourceClientId, targetClientId });
      showToast('Clients merged successfully');
      onOpenChange(false);
    } catch (mergeError) {
      setError(extractApiErrorMessage(mergeError));
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-6">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="merge-clients-title"
        className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg"
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
      >
        <SectionTitle id="merge-clients-title" className="mb-2 text-base">
          Merge clients
        </SectionTitle>
        <p className="mb-4 text-sm text-muted-foreground">
          Move records from the source client into the target client. The source will be archived.
        </p>

        <div className="mb-4 space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="merge-source" className="text-sm font-medium">
              Source client
            </label>
            <NativeSelect
              id="merge-source"
              label="Source client"
              value={sourceClientId}
              disabled={isPending}
              onChange={(event) => {
                setSourceClientId(event.target.value);
              }}
            >
              <option value="">Select source…</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.displayName}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="merge-target" className="text-sm font-medium">
              Target client
            </label>
            <NativeSelect
              id="merge-target"
              label="Target client"
              value={targetClientId}
              disabled={isPending}
              onChange={(event) => {
                setTargetClientId(event.target.value);
              }}
            >
              <option value="">Select target…</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.displayName}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>

        {error ? (
          <p className="mb-4 rounded-md border border-danger/30 bg-danger-muted px-3 py-2 text-sm text-danger-foreground">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => {
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} className="gap-2">
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Merge
          </Button>
        </div>
      </form>
    </div>
  );
}
