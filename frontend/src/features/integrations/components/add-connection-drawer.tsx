'use client';

import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState, type SyntheticEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { SectionTitle, useToast } from '@/design-system';
import type { IntegrationCatalogProvider } from '@/features/integrations/api/integration.types';
import {
  useConnectIntegration,
  useCreateIntegrationConnection,
} from '@/features/integrations/hooks/use-integration-mutations';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

interface CredentialPair {
  readonly id: string;
  readonly key: string;
  readonly value: string;
}

interface AddConnectionDrawerProps {
  readonly open: boolean;
  readonly provider: IntegrationCatalogProvider | null;
  readonly onOpenChange: (open: boolean) => void;
}

function createCredentialPair(): CredentialPair {
  return {
    id: `${String(Date.now())}-${Math.random().toString(36).slice(2, 8)}`,
    key: '',
    value: '',
  };
}

function credentialsFromPairs(pairs: readonly CredentialPair[]): Record<string, string> {
  const credentials: Record<string, string> = {};
  for (const pair of pairs) {
    const key = pair.key.trim();
    if (key.length === 0) {
      continue;
    }
    credentials[key] = pair.value;
  }
  return credentials;
}

export function AddConnectionDrawer({ open, provider, onOpenChange }: AddConnectionDrawerProps) {
  const { showToast } = useToast();
  const createMutation = useCreateIntegrationConnection();
  const connectMutation = useConnectIntegration();
  const isSaving = createMutation.isPending || connectMutation.isPending;

  const [displayName, setDisplayName] = useState('');
  const [credentialPairs, setCredentialPairs] = useState<CredentialPair[]>([
    createCredentialPair(),
  ]);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !provider) {
      return;
    }
    setDisplayName(provider.label);
    setCredentialPairs([createCredentialPair()]);
    setFormError(null);
  }, [open, provider]);

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!provider) {
      return;
    }

    const name = displayName.trim();
    if (name.length === 0) {
      setFormError('Connection name is required.');
      return;
    }

    setFormError(null);

    try {
      const connection = await createMutation.mutateAsync({
        providerKey: provider.key,
        displayName: name,
      });

      const credentials = credentialsFromPairs(credentialPairs);
      if (Object.keys(credentials).length > 0) {
        await connectMutation.mutateAsync({
          connectionId: connection.id,
          payload: { credentials },
        });
      }

      showToast(
        Object.keys(credentials).length > 0
          ? 'Connection created and connected'
          : 'Connection created',
        'success',
      );
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
            <SectionTitle>Add connection</SectionTitle>
            {provider ? (
              <p className="text-sm text-muted-foreground">
                Provider: {provider.label} ({provider.key})
              </p>
            ) : null}
          </div>

          {formError ? <p className="text-sm text-danger">{formError}</p> : null}

          <div className="space-y-2">
            <label htmlFor="connection-display-name" className="text-sm font-medium">
              Connection name
            </label>
            <Input
              id="connection-display-name"
              value={displayName}
              disabled={isSaving || !provider}
              onChange={(event) => {
                setDisplayName(event.target.value);
              }}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Credentials</p>
                <p className="text-xs text-muted-foreground">
                  Optional key/value pairs. Leave empty to connect later.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={isSaving}
                onClick={() => {
                  setCredentialPairs((current) => [...current, createCredentialPair()]);
                }}
              >
                <Plus className="size-3.5" />
                Add field
              </Button>
            </div>

            <div className="space-y-3">
              {credentialPairs.map((pair, index) => (
                <div key={pair.id} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <Input
                    placeholder="Key"
                    value={pair.key}
                    disabled={isSaving}
                    aria-label={`Credential key ${String(index + 1)}`}
                    onChange={(event) => {
                      const value = event.target.value;
                      setCredentialPairs((current) =>
                        current.map((item) =>
                          item.id === pair.id ? { ...item, key: value } : item,
                        ),
                      );
                    }}
                  />
                  <Input
                    placeholder="Value"
                    type="password"
                    value={pair.value}
                    disabled={isSaving}
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
                    disabled={isSaving || credentialPairs.length <= 1}
                    aria-label={`Remove credential field ${String(index + 1)}`}
                    onClick={() => {
                      setCredentialPairs((current) =>
                        current.filter((item) => item.id !== pair.id),
                      );
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto flex justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
              onClick={() => {
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || !provider} className="gap-2">
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
              Create connection
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
