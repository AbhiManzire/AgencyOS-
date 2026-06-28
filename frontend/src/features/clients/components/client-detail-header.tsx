import { Archive, Pencil } from 'lucide-react';
import { Avatar, Body, Caption } from '@/design-system';
import { Button } from '@/components/ui/button';
import type { ClientRecord } from '@/features/clients/api/client.types';
import { ClientStatusBadge } from '@/features/clients/components/client-status-badge';
import { displayClientField } from '@/features/clients/utils/client-display';

interface ClientDetailHeaderProps {
  readonly client: ClientRecord;
  readonly onEdit: () => void;
}

export function ClientDetailHeader({ client, onEdit }: ClientDetailHeaderProps) {
  const ownerLabel = displayClientField(client.ownerUserId);

  return (
    <div className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-start md:justify-between">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {client.displayName}
          </h1>
          <ClientStatusBadge status={client.status} />
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
        <Button type="button" variant="outline" className="gap-2" onClick={onEdit}>
          <Pencil className="size-4" />
          Edit
        </Button>
        <Button type="button" variant="outline" disabled className="gap-2 text-danger">
          <Archive className="size-4" />
          Archive
        </Button>
      </div>
    </div>
  );
}
