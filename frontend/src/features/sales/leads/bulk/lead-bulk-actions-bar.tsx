'use client';

import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { useToast } from '@/design-system';
import {
  bulkAddLeadTags,
  bulkAssignLeadOwner,
  bulkChangeLeadStatus,
  bulkDeleteLeads,
  bulkExportLeads,
  exportLeads,
  type LeadExportFormat,
} from '@/features/sales/leads/api/leads.api';
import type { ListLeadsParams } from '@/features/sales/leads/api/lead.types';
import type { LeadStatus } from '@/features/sales/leads/types';
import { LEAD_STATUS_LABELS } from '@/features/sales/leads/utils/lead-display';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

interface LeadOwnerOption {
  readonly id: string;
  readonly label: string;
}

interface LeadBulkActionsBarProps {
  readonly selectedIds: ReadonlySet<string>;
  readonly owners: readonly LeadOwnerOption[];
  readonly listFilters: ListLeadsParams;
  readonly onCleared: () => void;
  readonly onCompleted: () => void;
}

type BulkStatus = Exclude<LeadStatus, 'ARCHIVED' | 'CONVERTED'>;

export function LeadBulkActionsBar({
  selectedIds,
  owners,
  listFilters,
  onCleared,
  onCompleted,
}: LeadBulkActionsBarProps) {
  const { showToast } = useToast();
  const [ownerId, setOwnerId] = useState('');
  const [status, setStatus] = useState<BulkStatus | ''>('');
  const [tagInput, setTagInput] = useState('');
  const [exportFormat, setExportFormat] = useState<LeadExportFormat>('csv');
  const [isPending, setIsPending] = useState(false);

  const selectedCount = selectedIds.size;
  const leadIds = Array.from(selectedIds);

  if (selectedCount === 0) {
    return null;
  }

  const runBulk = async (work: () => Promise<void>): Promise<void> => {
    setIsPending(true);
    try {
      await work();
      onCompleted();
    } catch (error) {
      showToast(extractApiErrorMessage(error), 'error');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-3 lg:flex-row lg:items-center lg:justify-between">
      <p className="text-sm font-medium">
        {selectedCount} selected
        <Button type="button" variant="ghost" size="sm" className="ml-2" onClick={onCleared}>
          Clear
        </Button>
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <NativeSelect
          label="Assign owner"
          value={ownerId}
          onChange={(event) => {
            setOwnerId(event.target.value);
          }}
          className="min-w-[150px]"
        >
          <option value="">Assign owner…</option>
          {owners.map((owner) => (
            <option key={owner.id} value={owner.id}>
              {owner.label}
            </option>
          ))}
        </NativeSelect>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending || ownerId.length === 0}
          onClick={() => {
            void runBulk(async () => {
              const result = await bulkAssignLeadOwner(leadIds, ownerId);
              showToast(
                `Assigned owner — ${String(result.succeeded.length)} succeeded, ${String(result.failed.length)} failed`,
              );
            });
          }}
        >
          Apply owner
        </Button>

        <NativeSelect
          label="Change status"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as BulkStatus | '');
          }}
          className="min-w-[140px]"
        >
          <option value="">Change status…</option>
          {(Object.keys(LEAD_STATUS_LABELS) as LeadStatus[])
            .filter((key) => key !== 'ARCHIVED' && key !== 'CONVERTED')
            .map((key) => (
              <option key={key} value={key}>
                {LEAD_STATUS_LABELS[key]}
              </option>
            ))}
        </NativeSelect>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending || status.length === 0}
          onClick={() => {
            void runBulk(async () => {
              const result = await bulkChangeLeadStatus(leadIds, status as BulkStatus);
              showToast(
                `Status updated — ${String(result.succeeded.length)} succeeded, ${String(result.failed.length)} failed`,
              );
            });
          }}
        >
          Apply status
        </Button>

        <Input
          placeholder="Tags (comma-separated)"
          value={tagInput}
          onChange={(event) => {
            setTagInput(event.target.value);
          }}
          className="min-w-[180px]"
          aria-label="Tags to add"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending || tagInput.trim().length === 0}
          onClick={() => {
            const tagNames = tagInput
              .split(',')
              .map((tag) => tag.trim())
              .filter((tag) => tag.length > 0);
            void runBulk(async () => {
              const result = await bulkAddLeadTags(leadIds, tagNames);
              showToast(
                `Tags added — ${String(result.succeeded.length)} succeeded, ${String(result.failed.length)} failed`,
              );
              setTagInput('');
            });
          }}
        >
          Add tags
        </Button>

        <NativeSelect
          label="Export format"
          value={exportFormat}
          onChange={(event) => {
            setExportFormat(event.target.value as LeadExportFormat);
          }}
          className="min-w-[110px]"
        >
          <option value="csv">CSV</option>
          <option value="xlsx">Excel</option>
        </NativeSelect>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => {
            void runBulk(async () => {
              await bulkExportLeads(leadIds, exportFormat);
              showToast('Selected leads exported');
            });
          }}
        >
          Export selected
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => {
            void runBulk(async () => {
              await exportLeads({
                format: exportFormat,
                mode: 'filter',
                filters: listFilters,
              });
              showToast('Current filter exported');
            });
          }}
        >
          Export filter
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => {
            void runBulk(async () => {
              await exportLeads({ format: exportFormat, mode: 'all' });
              showToast('All leads exported');
            });
          }}
        >
          Export all
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          className="text-destructive hover:text-destructive"
          onClick={() => {
            void runBulk(async () => {
              const result = await bulkDeleteLeads(leadIds);
              showToast(
                `Archived — ${String(result.succeeded.length)} succeeded, ${String(result.failed.length)} failed`,
              );
              onCleared();
            });
          }}
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Delete
        </Button>
      </div>
    </div>
  );
}
