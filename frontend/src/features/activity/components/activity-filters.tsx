'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import {
  ACTIVITY_TYPE_LABELS,
  type ActivityOrigin,
  type ActivityType,
} from '@/features/activity/api/activity.types';
import type { ActivityTimelineFilters } from '@/features/activity/types';
import { useWorkspaceOwners } from '@/features/clients/hooks/use-workspace-owners';

interface ActivityFiltersProps {
  readonly filters: ActivityTimelineFilters;
  readonly onChange: (filters: ActivityTimelineFilters) => void;
}

const ORIGIN_OPTIONS: readonly { readonly value: '' | ActivityOrigin; readonly label: string }[] = [
  { value: '', label: 'All origins' },
  { value: 'SYSTEM', label: 'System' },
  { value: 'MANUAL', label: 'Manual' },
];

const TYPE_OPTIONS = Object.entries(ACTIVITY_TYPE_LABELS) as readonly [ActivityType, string][];

export function ActivityFilters({ filters, onChange }: ActivityFiltersProps) {
  const { data: owners = [] } = useWorkspaceOwners();

  const update = <K extends keyof ActivityTimelineFilters>(
    key: K,
    value: ActivityTimelineFilters[K] | undefined,
  ): void => {
    const next: ActivityTimelineFilters = { ...filters };
    if (value === undefined || value === '') {
      const { [key]: _removed, ...rest } = next;
      onChange(rest);
      return;
    }
    onChange({ ...next, [key]: value });
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1.5">
        <label htmlFor="activity-filter-type" className="text-xs font-medium text-muted-foreground">
          Type
        </label>
        <NativeSelect
          id="activity-filter-type"
          value={filters.type ?? ''}
          onChange={(event) => {
            update('type', (event.target.value || undefined) as ActivityType | undefined);
          }}
        >
          <option value="">All types</option>
          {TYPE_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="activity-filter-user" className="text-xs font-medium text-muted-foreground">
          User
        </label>
        <NativeSelect
          id="activity-filter-user"
          value={filters.userId ?? ''}
          onChange={(event) => {
            update('userId', event.target.value || undefined);
          }}
        >
          <option value="">All users</option>
          {owners.map((owner) => (
            <option key={owner.id} value={owner.id}>
              {owner.displayName}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="activity-filter-origin"
          className="text-xs font-medium text-muted-foreground"
        >
          Origin
        </label>
        <NativeSelect
          id="activity-filter-origin"
          value={filters.origin ?? ''}
          onChange={(event) => {
            update('origin', (event.target.value || undefined) as ActivityOrigin | undefined);
          }}
        >
          {ORIGIN_OPTIONS.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="activity-filter-from" className="text-xs font-medium text-muted-foreground">
          From
        </label>
        <Input
          id="activity-filter-from"
          type="date"
          value={filters.createdFrom?.slice(0, 10) ?? ''}
          onChange={(event) => {
            const value = event.target.value;
            update('createdFrom', value.length > 0 ? `${value}T00:00:00.000Z` : undefined);
          }}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="activity-filter-to" className="text-xs font-medium text-muted-foreground">
          To
        </label>
        <Input
          id="activity-filter-to"
          type="date"
          value={filters.createdTo?.slice(0, 10) ?? ''}
          onChange={(event) => {
            const value = event.target.value;
            update('createdTo', value.length > 0 ? `${value}T23:59:59.999Z` : undefined);
          }}
        />
      </div>

      {Object.keys(filters).length > 0 ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            onChange({});
          }}
        >
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}
