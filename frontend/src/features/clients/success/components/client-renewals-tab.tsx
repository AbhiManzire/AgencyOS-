'use client';

import { Loader2, Plus } from 'lucide-react';
import { useMemo, useState, type SyntheticEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState, ErrorState, LoadingState, SectionTitle, useToast } from '@/design-system';
import type {
  ClientRenewalFormValues,
  ClientRenewalRecord,
  ClientRenewalStatus,
  ClientRenewalType,
  CreateClientRenewalPayload,
  UpdateClientRenewalPayload,
} from '@/features/clients/success/api/client-renewals.types';
import {
  CLIENT_RENEWAL_STATUSES,
  CLIENT_RENEWAL_STATUS_LABELS,
  CLIENT_RENEWAL_TYPE_LABELS,
  CLIENT_RENEWAL_TYPES,
} from '@/features/clients/success/api/client-renewals.types';
import {
  useClientRenewals,
  useCreateClientRenewal,
  useDeleteClientRenewal,
  useUpdateClientRenewal,
} from '@/features/clients/success/hooks/use-client-renewals';
import { formatShortDate } from '@/lib/format/date';
import { formatMoney } from '@/lib/format/money';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { Can } from '@/lib/rbac';

interface ClientRenewalsTabProps {
  readonly clientId: string;
  readonly readOnly?: boolean;
  readonly currency?: string;
}

const DEFAULT_FORM: ClientRenewalFormValues = {
  type: 'HOSTING',
  title: '',
  description: '',
  amount: '',
  currency: 'USD',
  renewalDate: '',
  reminderDate: '',
  autoNotify: true,
  status: 'UPCOMING',
};

function renewalToFormValues(renewal: ClientRenewalRecord): ClientRenewalFormValues {
  return {
    type: renewal.type,
    title: renewal.title,
    description: renewal.description ?? '',
    amount: renewal.amount === null ? '' : String(renewal.amount),
    currency: renewal.currency ?? 'USD',
    renewalDate: renewal.renewalDate.slice(0, 10),
    reminderDate: renewal.reminderDate ? renewal.reminderDate.slice(0, 10) : '',
    autoNotify: renewal.autoNotify,
    status: renewal.status,
  };
}

function toCreatePayload(values: ClientRenewalFormValues): CreateClientRenewalPayload {
  const amountTrimmed = values.amount.trim();
  const reminderTrimmed = values.reminderDate.trim();
  const descriptionTrimmed = values.description.trim();

  return {
    type: values.type,
    title: values.title.trim(),
    renewalDate: values.renewalDate,
    autoNotify: values.autoNotify,
    status: values.status,
    ...(descriptionTrimmed.length > 0 ? { description: descriptionTrimmed } : {}),
    ...(amountTrimmed.length > 0 ? { amount: Number(amountTrimmed) } : {}),
    ...(values.currency.trim().length > 0
      ? { currency: values.currency.trim().toUpperCase() }
      : {}),
    ...(reminderTrimmed.length > 0 ? { reminderDate: reminderTrimmed } : {}),
  };
}

function toUpdatePayload(values: ClientRenewalFormValues): UpdateClientRenewalPayload {
  const amountTrimmed = values.amount.trim();
  const reminderTrimmed = values.reminderDate.trim();
  const descriptionTrimmed = values.description.trim();

  return {
    type: values.type,
    title: values.title.trim(),
    renewalDate: values.renewalDate,
    autoNotify: values.autoNotify,
    status: values.status,
    description: descriptionTrimmed.length > 0 ? descriptionTrimmed : null,
    amount: amountTrimmed.length > 0 ? Number(amountTrimmed) : null,
    currency: values.currency.trim().length > 0 ? values.currency.trim().toUpperCase() : null,
    reminderDate: reminderTrimmed.length > 0 ? reminderTrimmed : null,
  };
}

export function ClientRenewalsTab({
  clientId,
  readOnly = false,
  currency = 'USD',
}: ClientRenewalsTabProps) {
  const { showToast } = useToast();
  const { data, isLoading, error, refetch } = useClientRenewals(clientId);
  const { mutateAsync: createRenewal, isPending: isCreating } = useCreateClientRenewal(clientId);
  const { mutateAsync: updateRenewal, isPending: isUpdating } = useUpdateClientRenewal(clientId);
  const { mutateAsync: deleteRenewal, isPending: isDeleting } = useDeleteClientRenewal(clientId);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ClientRenewalRecord | null>(null);
  const [values, setValues] = useState<ClientRenewalFormValues>(DEFAULT_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  const isSaving = isCreating || isUpdating;
  const renewals = data?.items ?? [];

  const drawerTitle = useMemo(() => (editing !== null ? 'Edit renewal' : 'Add renewal'), [editing]);

  const openCreate = (): void => {
    setEditing(null);
    setValues({ ...DEFAULT_FORM, currency });
    setFormError(null);
    setDrawerOpen(true);
  };

  const openEdit = (renewal: ClientRenewalRecord): void => {
    setEditing(renewal);
    setValues(renewalToFormValues(renewal));
    setFormError(null);
    setDrawerOpen(true);
  };

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (values.title.trim().length === 0) {
      setFormError('Title is required');
      return;
    }
    if (values.renewalDate.trim().length === 0) {
      setFormError('Renewal date is required');
      return;
    }

    try {
      if (editing !== null) {
        await updateRenewal({ renewalId: editing.id, payload: toUpdatePayload(values) });
        showToast('Renewal updated successfully');
      } else {
        await createRenewal(toCreatePayload(values));
        showToast('Renewal created successfully');
      }
      setDrawerOpen(false);
    } catch (submitError) {
      setFormError(extractApiErrorMessage(submitError));
    }
  };

  const handleDelete = async (renewalId: string): Promise<void> => {
    try {
      await deleteRenewal(renewalId);
      showToast('Renewal deleted successfully');
    } catch (deleteError) {
      showToast(extractApiErrorMessage(deleteError), 'error');
    }
  };

  if (isLoading) {
    return <LoadingState label="Loading renewals..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={extractApiErrorMessage(error)}
        action={
          <Button variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Renewals</h2>
          <p className="text-sm text-muted-foreground">
            Track hosting, retainers, domains, and other renewals.
          </p>
        </div>
        {!readOnly ? (
          <Can permission="clients.create">
            <Button type="button" className="gap-2" onClick={openCreate}>
              <Plus className="size-4" />
              Add renewal
            </Button>
          </Can>
        ) : null}
      </div>

      {renewals.length === 0 ? (
        <EmptyState
          title="No renewals yet"
          description="Create the first renewal to track upcoming dates and reminders."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Renewal date</TableHead>
                <TableHead>Reminder</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="w-28 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renewals.map((renewal) => (
                <TableRow key={renewal.id}>
                  <TableCell className="font-medium">{renewal.title}</TableCell>
                  <TableCell>{CLIENT_RENEWAL_TYPE_LABELS[renewal.type]}</TableCell>
                  <TableCell>{CLIENT_RENEWAL_STATUS_LABELS[renewal.status]}</TableCell>
                  <TableCell>{formatShortDate(renewal.renewalDate)}</TableCell>
                  <TableCell>{formatShortDate(renewal.reminderDate)}</TableCell>
                  <TableCell>
                    {renewal.amount === null
                      ? '—'
                      : formatMoney(renewal.amount, renewal.currency ?? currency)}
                  </TableCell>
                  <TableCell className="text-right">
                    {!readOnly ? (
                      <div className="flex justify-end gap-2">
                        <Can permission="clients.update">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              openEdit(renewal);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isDeleting}
                            onClick={() => {
                              void handleDelete(renewal.id);
                            }}
                          >
                            Delete
                          </Button>
                        </Can>
                      </div>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="relative w-full max-w-md gap-0 p-0 sm:max-w-lg">
          <form
            className="flex h-full flex-col"
            onSubmit={(event) => {
              void handleSubmit(event);
            }}
          >
            <header className="border-b border-border px-6 py-4 pr-12">
              <SectionTitle>{drawerTitle}</SectionTitle>
            </header>

            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
              <div className="space-y-1.5">
                <label htmlFor="renewal-type" className="text-sm font-medium">
                  Type
                </label>
                <NativeSelect
                  id="renewal-type"
                  label="Type"
                  value={values.type}
                  disabled={isSaving}
                  onChange={(event) => {
                    setValues((current) => ({
                      ...current,
                      type: event.target.value as ClientRenewalType,
                    }));
                  }}
                >
                  {CLIENT_RENEWAL_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {CLIENT_RENEWAL_TYPE_LABELS[type]}
                    </option>
                  ))}
                </NativeSelect>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="renewal-title" className="text-sm font-medium">
                  Title
                </label>
                <Input
                  id="renewal-title"
                  value={values.title}
                  disabled={isSaving}
                  onChange={(event) => {
                    setValues((current) => ({ ...current, title: event.target.value }));
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="renewal-date" className="text-sm font-medium">
                  Renewal date
                </label>
                <Input
                  id="renewal-date"
                  type="date"
                  value={values.renewalDate}
                  disabled={isSaving}
                  onChange={(event) => {
                    setValues((current) => ({ ...current, renewalDate: event.target.value }));
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="reminder-date" className="text-sm font-medium">
                  Reminder date
                </label>
                <Input
                  id="reminder-date"
                  type="date"
                  value={values.reminderDate}
                  disabled={isSaving}
                  onChange={(event) => {
                    setValues((current) => ({ ...current, reminderDate: event.target.value }));
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="renewal-amount" className="text-sm font-medium">
                    Amount
                  </label>
                  <Input
                    id="renewal-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={values.amount}
                    disabled={isSaving}
                    onChange={(event) => {
                      setValues((current) => ({ ...current, amount: event.target.value }));
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="renewal-currency" className="text-sm font-medium">
                    Currency
                  </label>
                  <Input
                    id="renewal-currency"
                    value={values.currency}
                    disabled={isSaving}
                    maxLength={3}
                    onChange={(event) => {
                      setValues((current) => ({
                        ...current,
                        currency: event.target.value.toUpperCase(),
                      }));
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="renewal-status" className="text-sm font-medium">
                  Status
                </label>
                <NativeSelect
                  id="renewal-status"
                  label="Status"
                  value={values.status}
                  disabled={isSaving}
                  onChange={(event) => {
                    setValues((current) => ({
                      ...current,
                      status: event.target.value as ClientRenewalStatus,
                    }));
                  }}
                >
                  {CLIENT_RENEWAL_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {CLIENT_RENEWAL_STATUS_LABELS[status]}
                    </option>
                  ))}
                </NativeSelect>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="auto-notify"
                  checked={values.autoNotify}
                  disabled={isSaving}
                  onCheckedChange={(checked) => {
                    setValues((current) => ({ ...current, autoNotify: checked === true }));
                  }}
                />
                <label htmlFor="auto-notify" className="text-sm text-foreground">
                  Auto notify
                </label>
              </div>

              {formError ? (
                <p className="rounded-md border border-danger/30 bg-danger-muted px-3 py-2 text-sm text-danger-foreground">
                  {formError}
                </p>
              ) : null}
            </div>

            <footer className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
              <Button
                type="button"
                variant="outline"
                disabled={isSaving}
                onClick={() => {
                  setDrawerOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="gap-2">
                {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
                {editing !== null ? 'Save changes' : 'Create renewal'}
              </Button>
            </footer>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
