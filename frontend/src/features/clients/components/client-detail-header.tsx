'use client';

import { Archive, Pencil, RotateCcw } from 'lucide-react';
import { useMemo } from 'react';
import { Avatar, Body, Caption } from '@/design-system';
import { Button } from '@/components/ui/button';
import type { ClientRecord } from '@/features/clients/api/client.types';
import { ClientArchivedBadge } from '@/features/clients/components/client-archived-badge';
import { ClientStatusBadge } from '@/features/clients/components/client-status-badge';
import { useWorkspaceOwners } from '@/features/clients/hooks/use-workspace-owners';
import { displayClientField } from '@/features/clients/utils/client-display';
import { isClientArchived } from '@/features/clients/utils/list-clients-query';
import { Can } from '@/lib/rbac';

interface ClientDetailHeaderProps {
  readonly client: ClientRecord;
  readonly onEdit: () => void;
  readonly onArchive: () => void;
  readonly onRestore: () => void;
  readonly isRestorePending?: boolean;
}

export function ClientDetailHeader({
  client,
  onEdit,
  onArchive,
  onRestore,
  isRestorePending = false,
}: ClientDetailHeaderProps) {
  const { data: owners = [] } = useWorkspaceOwners();
  const ownerLabel = useMemo(() => {
    if (client.ownerUserId === null) {
      return '—';
    }

    const owner = owners.find((item) => item.id === client.ownerUserId);
    return owner?.displayName ?? displayClientField(client.ownerUserId);
  }, [client.ownerUserId, owners]);

  const archived = isClientArchived(client);

  return (
    <div className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-start md:justify-between">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1
            className={
              archived
                ? 'text-2xl font-semibold tracking-tight text-muted-foreground md:text-3xl'
                : 'text-2xl font-semibold tracking-tight text-foreground md:text-3xl'
            }
          >
            {client.displayName}
          </h1>
          <ClientStatusBadge status={archived ? 'ARCHIVED' : client.status} />
          {archived ? <ClientArchivedBadge /> : null}
        </div>

        <div className="flex items-center gap-3">
          <Avatar initials={ownerLabel.slice(0, 2).toUpperCase()} size="sm" />
          <div>
            <Caption className="block uppercase tracking-wide">Owner</Caption>
            <Body className="text-muted-foreground">{ownerLabel}</Body>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Can permission="clients.update" mode="disable">
          <Button
            type="button"
            variant="outline"
            disabled={archived}
            className="gap-2"
            onClick={onEdit}
          >
            <Pencil className="size-4" />
            Edit
          </Button>
        </Can>
        {archived ? (
          <Can permission="clients.restore" mode="disable">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              disabled={isRestorePending}
              onClick={onRestore}
            >
              <RotateCcw className="size-4" />
              Restore
            </Button>
          </Can>
        ) : (
          <Can permission="clients.archive" mode="disable">
            <Button
              type="button"
              variant="outline"
              className="gap-2 text-danger"
              onClick={onArchive}
            >
              <Archive className="size-4" />
              Archive
            </Button>
          </Can>
        )}
      </div>
    </div>
  );
}
