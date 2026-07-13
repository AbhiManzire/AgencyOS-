'use client';

import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState, type SyntheticEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { SectionTitle, useToast } from '@/design-system';
import type { IntegrationConnectionRecord } from '@/features/integrations/api/integration.types';
import { useConnectIntegration } from '@/features/integrations/hooks/use-integration-mutations';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

interface CredentialPair {
  readonly id: string;
  readonly key: string;
  readonly value: string;
}

interface ConnectCredentialsDrawerProps {
  readonly open: boolean;
  readonly connection: IntegrationConnectionRecord | null;
  readonly onOpenChange: (open: boolean) => void;
}

function createCredentialPair(): CredentialPair {
  return {
    id: `${String(Date.now())}-${Math.random().toString(36).slice(2, 8)}`,
    key: '',
    value: '',
  };
}

export function ConnectCredentialsDrawer({
  open,
  connection,
  onOpenChange,
}: ConnectCredentialsDrawerProps) {
  const { showToast } = useToast();
  const connectMutation = useConnectIntegration();
  const [credentialPairs, setCredentialPairs] = useState<CredentialPair[]>([
    createCredentialPair(),
  ]);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setCredentialPairs([createCredentialPair()]);
    setFormError(null);
  }, [open, connection?.id]);

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!connection) {
      return;
    }

    const credentials: Record<string, string> = {};
    for (const pair of credentialPairs) {
      const key = pair.key.trim();
      if (key.length === 0) {
        continue;
      }
      credentials[key] = pair.value;
    }

    if (Object.keys(credentials).length === 0) {
      setFormError('Add at least one credential key/value pair.');
      return;
    }

    setFormError(null);

    try {
      await connectMutation.mutateAsync({
        connectionId: connection.id,
        payload: { credentials },
      });
      showToast('Connection connected', 'success');
      onOpenChange(false);
    } catch (error) {
      setFormError(extractApiErrorMessage(error));
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <form className="flex h-full flex-col gap-6" onSubmit={(event) => void handleSubmit(event)}>
          <div className="space-y-1">
            <SectionTitle>Connect integration</SectionTitle>
            {connection ? (
              <p className="text-sm text-muted-foreground">
                {connection.displayName} ({connection.providerKey})
              </p>
            ) : null}
          </div>

          {formError ? <p className="text-sm text-danger">{formError}</p> : null}

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">Credentials</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={connectMutation.isPending}
                onClick={() => {
                  setCredentialPairs((current) => [...current, createCredentialPair()]);
                }}
              >
                <Plus className="size-3.5" />
                Add field
              </Button>
            </div>

            {credentialPairs.map((pair, index) => (
              <div key={pair.id} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <Input
                  placeholder="Key"
                  value={pair.key}
                  disabled={connectMutation.isPending}
                  aria-label={`Credential key ${String(index + 1)}`}
                  onChange={(event) => {
                    const value = event.target.value;
                    setCredentialPairs((current) =>
                      current.map((item) => (item.id === pair.id ? { ...item, key: value } : item)),
                    );
                  }}
                />
                <Input
                  placeholder="Value"
                  type="password"
                  value={pair.value}
                  disabled={connectMutation.isPending}
                  aria-label={`Credential value ${String(index + 1)}`}
                  onChange={(event) => {
                    const value = event.target.value;
                    setCredentialPairs((current) =>
                      current.map((item) => (item.id === pair.id ? { ...item, value } : item)),
                    );
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={connectMutation.isPending || credentialPairs.length <= 1}
                  aria-label={`Remove credential field ${String(index + 1)}`}
                  onClick={() => {
                    setCredentialPairs((current) => current.filter((item) => item.id !== pair.id));
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-auto flex justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={connectMutation.isPending}
              onClick={() => {
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={connectMutation.isPending || !connection}
              className="gap-2"
            >
              {connectMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Connect
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
