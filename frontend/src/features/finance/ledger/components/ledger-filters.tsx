'use client';

import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import type { LedgerAccountType } from '@/features/finance/shared/finance.types';
import { LEDGER_ACCOUNT_TYPE_LABELS } from '@/features/finance/shared/finance.types';

export const LEDGER_ACCOUNT_TYPE_OPTIONS: readonly LedgerAccountType[] = [
  'RECEIVABLE',
  'PAYABLE',
  'PAYMENT',
  'CLIENT',
  'VENDOR',
];

export interface LedgerFiltersState {
  readonly clientId: string;
  readonly vendorId: string;
  readonly accountType: '' | LedgerAccountType;
  readonly fromDate: string;
  readonly toDate: string;
}

interface LedgerFiltersProps {
  readonly filters: LedgerFiltersState;
  readonly onChange: (next: LedgerFiltersState) => void;
}

export function LedgerFilters({ filters, onChange }: LedgerFiltersProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex min-w-[12rem] flex-1 flex-col gap-1">
          <label htmlFor="ledger-client-id" className="text-xs font-medium text-muted-foreground">
            Client ID
          </label>
          <Input
            id="ledger-client-id"
            value={filters.clientId}
            placeholder="UUID"
            onChange={(event) => {
              onChange({ ...filters, clientId: event.target.value });
            }}
            aria-label="Filter by client ID"
          />
        </div>

        <div className="flex min-w-[12rem] flex-1 flex-col gap-1">
          <label htmlFor="ledger-vendor-id" className="text-xs font-medium text-muted-foreground">
            Vendor ID
          </label>
          <Input
            id="ledger-vendor-id"
            value={filters.vendorId}
            placeholder="UUID"
            onChange={(event) => {
              onChange({ ...filters, vendorId: event.target.value });
            }}
            aria-label="Filter by vendor ID"
          />
        </div>

        <div className="flex min-w-[10rem] flex-col gap-1">
          <label
            htmlFor="ledger-account-type"
            className="text-xs font-medium text-muted-foreground"
          >
            Account type
          </label>
          <NativeSelect
            id="ledger-account-type"
            label="Account type"
            value={filters.accountType}
            onChange={(event) => {
              const value = event.target.value;
              onChange({
                ...filters,
                accountType: value === '' ? '' : (value as LedgerAccountType),
              });
            }}
          >
            <option value="">All types</option>
            {LEDGER_ACCOUNT_TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {LEDGER_ACCOUNT_TYPE_LABELS[type]}
              </option>
            ))}
          </NativeSelect>
        </div>

        <div className="flex min-w-[10rem] flex-col gap-1">
          <label htmlFor="ledger-from" className="text-xs font-medium text-muted-foreground">
            From
          </label>
          <Input
            id="ledger-from"
            type="date"
            value={filters.fromDate}
            onChange={(event) => {
              onChange({ ...filters, fromDate: event.target.value });
            }}
            aria-label="Filter from date"
          />
        </div>

        <div className="flex min-w-[10rem] flex-col gap-1">
          <label htmlFor="ledger-to" className="text-xs font-medium text-muted-foreground">
            To
          </label>
          <Input
            id="ledger-to"
            type="date"
            value={filters.toDate}
            onChange={(event) => {
              onChange({ ...filters, toDate: event.target.value });
            }}
            aria-label="Filter to date"
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Date range filters are applied client-side after fetch. Account, client, and vendor filters
        are sent to the API.
      </p>
    </div>
  );
}
