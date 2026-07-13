'use client';

import { Loader2 } from 'lucide-react';
import { useState, type SyntheticEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { SectionTitle } from '@/design-system/typography';
import { todayDateInputValue } from '@/features/sales/workspace/utils/workspace-labels';

interface OwnerOption {
  readonly id: string;
  readonly label: string;
}

interface RescheduleDialogProps {
  readonly open: boolean;
  readonly isPending: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: (values: { dueDate: string; dueTime: string | null }) => void;
}

/** Small dialog to reschedule a sales task. */
export function RescheduleTaskDialog({
  open,
  isPending,
  onCancel,
  onConfirm,
}: RescheduleDialogProps) {
  const [dueDate, setDueDate] = useState(todayDateInputValue());
  const [dueTime, setDueTime] = useState('');

  if (!open) {
    return null;
  }

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onConfirm({
      dueDate,
      dueTime: dueTime.trim().length > 0 ? dueTime.trim() : null,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-6">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="reschedule-task-title"
        className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg"
        onSubmit={handleSubmit}
      >
        <SectionTitle id="reschedule-task-title" className="mb-4 text-base">
          Reschedule task
        </SectionTitle>
        <div className="mb-6 space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="reschedule-due-date" className="text-sm font-medium text-foreground">
              Due date <span className="text-danger">*</span>
            </label>
            <Input
              id="reschedule-due-date"
              type="date"
              required
              value={dueDate}
              disabled={isPending}
              onChange={(event) => {
                setDueDate(event.target.value);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="reschedule-due-time" className="text-sm font-medium text-foreground">
              Due time
            </label>
            <Input
              id="reschedule-due-time"
              type="time"
              value={dueTime}
              disabled={isPending}
              onChange={(event) => {
                setDueTime(event.target.value);
              }}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" disabled={isPending} onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} className="gap-2">
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Save
          </Button>
        </div>
      </form>
    </div>
  );
}

interface ReassignDialogProps {
  readonly open: boolean;
  readonly isPending: boolean;
  readonly owners: readonly OwnerOption[];
  readonly onCancel: () => void;
  readonly onConfirm: (ownerUserId: string) => void;
}

/** Small dialog to reassign a sales task. */
export function ReassignTaskDialog({
  open,
  isPending,
  owners,
  onCancel,
  onConfirm,
}: ReassignDialogProps) {
  const [ownerUserId, setOwnerUserId] = useState(owners[0]?.id ?? '');

  if (!open) {
    return null;
  }

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (ownerUserId.trim().length === 0) {
      return;
    }
    onConfirm(ownerUserId);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-6">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="reassign-task-title"
        className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg"
        onSubmit={handleSubmit}
      >
        <SectionTitle id="reassign-task-title" className="mb-4 text-base">
          Reassign task
        </SectionTitle>
        <div className="mb-6 space-y-1.5">
          <label htmlFor="reassign-owner" className="text-sm font-medium text-foreground">
            Owner <span className="text-danger">*</span>
          </label>
          <NativeSelect
            id="reassign-owner"
            value={ownerUserId}
            disabled={isPending || owners.length === 0}
            onChange={(event) => {
              setOwnerUserId(event.target.value);
            }}
          >
            <option value="" disabled>
              Select owner
            </option>
            {owners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.label}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" disabled={isPending} onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPending || ownerUserId.trim().length === 0}
            className="gap-2"
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Reassign
          </Button>
        </div>
      </form>
    </div>
  );
}

interface NoteDialogProps {
  readonly open: boolean;
  readonly title: string;
  readonly confirmLabel: string;
  readonly isPending: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: (note: string) => void;
}

/** Small dialog to capture a note / call log. */
export function QueueNoteDialog({
  open,
  title,
  confirmLabel,
  isPending,
  onCancel,
  onConfirm,
}: NoteDialogProps) {
  const [note, setNote] = useState('');

  if (!open) {
    return null;
  }

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onConfirm(note.trim());
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-6">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="queue-note-title"
        className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg"
        onSubmit={handleSubmit}
      >
        <SectionTitle id="queue-note-title" className="mb-4 text-base">
          {title}
        </SectionTitle>
        <div className="mb-6 space-y-1.5">
          <label htmlFor="queue-note" className="text-sm font-medium text-foreground">
            Note
          </label>
          <textarea
            id="queue-note"
            rows={4}
            value={note}
            disabled={isPending}
            className="flex min-h-[96px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            onChange={(event) => {
              setNote(event.target.value);
            }}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" disabled={isPending} onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} className="gap-2">
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {confirmLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
