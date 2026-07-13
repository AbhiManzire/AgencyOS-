'use client';

import { CalendarCheck, Check, Loader2, Plus } from 'lucide-react';
import { useEffect, useMemo, useState, type SyntheticEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  SectionTitle,
  StatusBadge,
  useToast,
} from '@/design-system';
import { Body, Caption } from '@/design-system/typography';
import type {
  CreateFollowUpPayload,
  FollowUpPriority,
  FollowUpRecurrence,
  FollowUpReminderType,
  FollowUpRecord,
} from '@/features/activity/follow-ups/api/follow-up.types';
import {
  FOLLOW_UP_PRIORITY_LABELS,
  FOLLOW_UP_RECURRENCE_LABELS,
  FOLLOW_UP_REMINDER_TYPE_LABELS,
  FOLLOW_UP_STATUS_LABELS,
} from '@/features/activity/follow-ups/api/follow-up.types';
import {
  useCompleteFollowUp,
  useCreateFollowUp,
  useFollowUps,
} from '@/features/activity/follow-ups/hooks/use-follow-ups';
import { useWorkspaceOwners } from '@/features/clients/hooks/use-workspace-owners';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { formatDateTime, formatShortDate } from '@/lib/format/date';

interface EntityFollowUpsPanelProps {
  readonly entityType: string;
  readonly entityId: string;
  readonly defaultAssigneeUserId?: string | null;
}

interface FollowUpFormValues {
  readonly title: string;
  readonly description: string;
  readonly followUpDate: string;
  readonly followUpTime: string;
  readonly priority: FollowUpPriority;
  readonly assignedUserId: string;
  readonly reminderType: FollowUpReminderType;
  readonly recurrence: FollowUpRecurrence;
}

type FollowUpFormErrors = Partial<Record<keyof FollowUpFormValues, string>>;

function todayDateInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

function defaultFormValues(defaultAssigneeUserId?: string | null): FollowUpFormValues {
  return {
    title: '',
    description: '',
    followUpDate: todayDateInputValue(),
    followUpTime: '09:00',
    priority: 'MEDIUM',
    assignedUserId: defaultAssigneeUserId ?? '',
    reminderType: 'FOLLOW_UP',
    recurrence: 'NONE',
  };
}

function validateForm(values: FollowUpFormValues): FollowUpFormErrors {
  const errors: FollowUpFormErrors = {};
  if (values.title.trim().length === 0) {
    errors.title = 'Title is required.';
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.followUpDate)) {
    errors.followUpDate = 'Date is required.';
  }
  if (!/^\d{2}:\d{2}$/.test(values.followUpTime)) {
    errors.followUpTime = 'Time must be HH:mm.';
  }
  if (values.assignedUserId.trim().length === 0) {
    errors.assignedUserId = 'Assignee is required.';
  }
  return errors;
}

function priorityVariant(priority: FollowUpPriority): 'neutral' | 'primary' | 'warning' | 'danger' {
  switch (priority) {
    case 'LOW':
      return 'neutral';
    case 'MEDIUM':
      return 'primary';
    case 'HIGH':
      return 'warning';
    case 'URGENT':
      return 'danger';
  }
}

function statusVariant(
  status: FollowUpRecord['status'],
): 'neutral' | 'primary' | 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'PENDING':
      return 'primary';
    case 'COMPLETED':
      return 'success';
    case 'MISSED':
      return 'warning';
    case 'CANCELLED':
      return 'neutral';
  }
}

function assigneeLabel(followUp: FollowUpRecord): string {
  const name = followUp.assignedUserDisplayName?.trim();
  if (name !== undefined && name.length > 0) {
    return name;
  }
  const email = followUp.assignedUserEmail?.trim();
  if (email !== undefined && email.length > 0) {
    return email;
  }
  return 'Unassigned';
}

export function EntityFollowUpsPanel({
  entityType,
  entityId,
  defaultAssigneeUserId,
}: EntityFollowUpsPanelProps) {
  const { showToast } = useToast();
  const { data: owners = [] } = useWorkspaceOwners();
  const {
    data: followUps = [],
    isLoading,
    error,
    refetch,
  } = useFollowUps({ entityType, entityId, take: 50 });
  const { mutateAsync: createFollowUp, isPending: isCreating } = useCreateFollowUp();
  const { mutateAsync: completeFollowUp, isPending: isCompleting } = useCompleteFollowUp();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [values, setValues] = useState<FollowUpFormValues>(() =>
    defaultFormValues(defaultAssigneeUserId),
  );
  const [errors, setErrors] = useState<FollowUpFormErrors>({});
  const [completingId, setCompletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!sheetOpen) {
      return;
    }
    setValues(defaultFormValues(defaultAssigneeUserId ?? (owners.length > 0 ? owners[0].id : '')));
    setErrors({});
  }, [defaultAssigneeUserId, owners, sheetOpen]);

  const sortedFollowUps = useMemo(
    () =>
      [...followUps].sort(
        (left, right) =>
          new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime(),
      ),
    [followUps],
  );

  const updateField = <K extends keyof FollowUpFormValues>(
    field: K,
    value: FollowUpFormValues[K],
  ): void => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (current[field] === undefined) {
        return current;
      }
      const { [field]: _removed, ...rest } = current;
      return rest;
    });
  };

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const nextErrors = validateForm(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const payload: CreateFollowUpPayload = {
      entityType,
      entityId,
      title: values.title.trim(),
      description: values.description.trim() || undefined,
      followUpDate: values.followUpDate,
      followUpTime: values.followUpTime,
      priority: values.priority,
      assignedUserId: values.assignedUserId,
      reminderType: values.reminderType,
      recurrence: values.recurrence,
    };

    try {
      await createFollowUp(payload);
      showToast('Follow-up scheduled successfully');
      setSheetOpen(false);
    } catch (createError) {
      showToast(extractApiErrorMessage(createError), 'error');
    }
  };

  const handleComplete = async (followUpId: string): Promise<void> => {
    setCompletingId(followUpId);
    try {
      await completeFollowUp(followUpId);
      showToast('Follow-up completed');
    } catch (completeError) {
      showToast(extractApiErrorMessage(completeError), 'error');
    } finally {
      setCompletingId(null);
    }
  };

  if (isLoading) {
    return <LoadingState label="Loading follow-ups..." />;
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">Follow-ups</h3>
          <p className="text-sm text-muted-foreground">Scheduled reminders for this record.</p>
        </div>
        <Button
          type="button"
          size="sm"
          className="gap-2"
          onClick={() => {
            setSheetOpen(true);
          }}
        >
          <Plus className="size-4" aria-hidden="true" />
          Schedule follow-up
        </Button>
      </div>

      {sortedFollowUps.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No follow-ups scheduled"
          description="Create a follow-up to track the next touchpoint."
          action={
            <Button
              type="button"
              size="sm"
              className="gap-2"
              onClick={() => {
                setSheetOpen(true);
              }}
            >
              <Plus className="size-4" aria-hidden="true" />
              Schedule follow-up
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {sortedFollowUps.map((followUp) => (
            <li key={followUp.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">{followUp.title}</p>
                    <StatusBadge variant={statusVariant(followUp.status)}>
                      {FOLLOW_UP_STATUS_LABELS[followUp.status]}
                    </StatusBadge>
                    <StatusBadge variant={priorityVariant(followUp.priority)}>
                      {FOLLOW_UP_PRIORITY_LABELS[followUp.priority]}
                    </StatusBadge>
                  </div>
                  <Caption className="text-muted-foreground">
                    {formatShortDate(followUp.followUpDate)} · {followUp.followUpTime} ·{' '}
                    {FOLLOW_UP_REMINDER_TYPE_LABELS[followUp.reminderType]} ·{' '}
                    {assigneeLabel(followUp)}
                  </Caption>
                  {followUp.description ? (
                    <Body className="text-sm text-muted-foreground">{followUp.description}</Body>
                  ) : null}
                  {followUp.completedAt !== null ? (
                    <Caption className="text-muted-foreground">
                      Completed {formatDateTime(followUp.completedAt)}
                    </Caption>
                  ) : null}
                </div>

                {followUp.status === 'PENDING' || followUp.status === 'MISSED' ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    disabled={isCompleting && completingId === followUp.id}
                    onClick={() => {
                      void handleComplete(followUp.id);
                    }}
                  >
                    {isCompleting && completingId === followUp.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Check className="size-4" aria-hidden="true" />
                    )}
                    Complete
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          <div className="space-y-6 p-1">
            <div>
              <SectionTitle>Schedule follow-up</SectionTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Set a date, assignee, and reminder type for the next action.
              </p>
            </div>

            <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
              <div className="space-y-1.5">
                <label htmlFor="follow-up-title" className="text-sm font-medium">
                  Title <span className="text-danger">*</span>
                </label>
                <Input
                  id="follow-up-title"
                  value={values.title}
                  onChange={(event) => {
                    updateField('title', event.target.value);
                  }}
                />
                {errors.title ? <p className="text-xs text-danger">{errors.title}</p> : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="follow-up-date" className="text-sm font-medium">
                    Date <span className="text-danger">*</span>
                  </label>
                  <Input
                    id="follow-up-date"
                    type="date"
                    value={values.followUpDate}
                    onChange={(event) => {
                      updateField('followUpDate', event.target.value);
                    }}
                  />
                  {errors.followUpDate ? (
                    <p className="text-xs text-danger">{errors.followUpDate}</p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="follow-up-time" className="text-sm font-medium">
                    Time <span className="text-danger">*</span>
                  </label>
                  <Input
                    id="follow-up-time"
                    type="time"
                    value={values.followUpTime}
                    onChange={(event) => {
                      updateField('followUpTime', event.target.value);
                    }}
                  />
                  {errors.followUpTime ? (
                    <p className="text-xs text-danger">{errors.followUpTime}</p>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="follow-up-priority" className="text-sm font-medium">
                    Priority
                  </label>
                  <NativeSelect
                    id="follow-up-priority"
                    value={values.priority}
                    onChange={(event) => {
                      updateField('priority', event.target.value as FollowUpPriority);
                    }}
                  >
                    {(Object.keys(FOLLOW_UP_PRIORITY_LABELS) as FollowUpPriority[]).map((value) => (
                      <option key={value} value={value}>
                        {FOLLOW_UP_PRIORITY_LABELS[value]}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="follow-up-assignee" className="text-sm font-medium">
                    Assignee <span className="text-danger">*</span>
                  </label>
                  <NativeSelect
                    id="follow-up-assignee"
                    value={values.assignedUserId}
                    onChange={(event) => {
                      updateField('assignedUserId', event.target.value);
                    }}
                  >
                    <option value="">Select assignee</option>
                    {owners.map((owner) => (
                      <option key={owner.id} value={owner.id}>
                        {owner.displayName}
                      </option>
                    ))}
                  </NativeSelect>
                  {errors.assignedUserId ? (
                    <p className="text-xs text-danger">{errors.assignedUserId}</p>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="follow-up-reminder-type" className="text-sm font-medium">
                    Reminder type <span className="text-danger">*</span>
                  </label>
                  <NativeSelect
                    id="follow-up-reminder-type"
                    value={values.reminderType}
                    onChange={(event) => {
                      updateField('reminderType', event.target.value as FollowUpReminderType);
                    }}
                  >
                    {(Object.keys(FOLLOW_UP_REMINDER_TYPE_LABELS) as FollowUpReminderType[]).map(
                      (value) => (
                        <option key={value} value={value}>
                          {FOLLOW_UP_REMINDER_TYPE_LABELS[value]}
                        </option>
                      ),
                    )}
                  </NativeSelect>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="follow-up-recurrence" className="text-sm font-medium">
                    Recurrence
                  </label>
                  <NativeSelect
                    id="follow-up-recurrence"
                    value={values.recurrence}
                    onChange={(event) => {
                      updateField('recurrence', event.target.value as FollowUpRecurrence);
                    }}
                  >
                    {(Object.keys(FOLLOW_UP_RECURRENCE_LABELS) as FollowUpRecurrence[]).map(
                      (value) => (
                        <option key={value} value={value}>
                          {FOLLOW_UP_RECURRENCE_LABELS[value]}
                        </option>
                      ),
                    )}
                  </NativeSelect>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="follow-up-description" className="text-sm font-medium">
                  Description
                </label>
                <textarea
                  id="follow-up-description"
                  rows={3}
                  value={values.description}
                  className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onChange={(event) => {
                    updateField('description', event.target.value);
                  }}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isCreating}
                  onClick={() => {
                    setSheetOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating} className="gap-2">
                  {isCreating ? <Loader2 className="size-4 animate-spin" /> : null}
                  Save follow-up
                </Button>
              </div>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
