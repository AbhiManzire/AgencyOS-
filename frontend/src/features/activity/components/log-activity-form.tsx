'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useState, type SyntheticEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { SectionTitle, useToast } from '@/design-system';
import {
  ACTIVITY_TYPE_LABELS,
  MANUAL_ACTIVITY_TYPES,
} from '@/features/activity/api/activity.types';
import { useCreateActivity } from '@/features/activity/hooks/use-activities';
import type { ManualActivityType } from '@/features/activity/types';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

interface LogActivityFormProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly entityType: string;
  readonly entityId: string;
}

interface FormValues {
  readonly type: ManualActivityType;
  readonly title: string;
  readonly description: string;
}

const DEFAULT_VALUES: FormValues = {
  type: 'NOTE',
  title: '',
  description: '',
};

export function LogActivityForm({
  open,
  onOpenChange,
  entityType,
  entityId,
}: LogActivityFormProps) {
  const { showToast } = useToast();
  const { mutateAsync: createActivity, isPending } = useCreateActivity();
  const [values, setValues] = useState<FormValues>(DEFAULT_VALUES);
  const [errors, setErrors] = useState<{ title?: string; type?: string }>({});

  useEffect(() => {
    if (!open) {
      return;
    }
    setValues(DEFAULT_VALUES);
    setErrors({});
  }, [open]);

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const title = values.title.trim();
    const nextErrors: { title?: string; type?: string } = {};
    if (title.length === 0) {
      nextErrors.title = 'Title is required.';
    }
    if (!MANUAL_ACTIVITY_TYPES.includes(values.type)) {
      nextErrors.type = 'Select a valid activity type.';
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      await createActivity({
        entityType,
        entityId,
        type: values.type,
        title,
        description: values.description.trim() || undefined,
        origin: 'MANUAL',
      });
      showToast('Activity logged successfully');
      onOpenChange(false);
    } catch (error) {
      showToast(extractApiErrorMessage(error), 'error');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <div className="space-y-6 p-1">
          <div>
            <SectionTitle>Log activity</SectionTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Record a call, meeting, note, or other manual touchpoint.
            </p>
          </div>

          <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
            <div className="space-y-1.5">
              <label htmlFor="log-activity-type" className="text-sm font-medium text-foreground">
                Type <span className="text-danger">*</span>
              </label>
              <NativeSelect
                id="log-activity-type"
                value={values.type}
                onChange={(event) => {
                  const type = event.target.value as ManualActivityType;
                  setValues((current) => ({
                    ...current,
                    type,
                    title:
                      current.title.trim().length === 0
                        ? ACTIVITY_TYPE_LABELS[type]
                        : current.title,
                  }));
                  setErrors((current) => {
                    const { type: _removed, ...rest } = current;
                    return rest;
                  });
                }}
              >
                {MANUAL_ACTIVITY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {ACTIVITY_TYPE_LABELS[type]}
                  </option>
                ))}
              </NativeSelect>
              {errors.type ? <p className="text-xs text-danger">{errors.type}</p> : null}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="log-activity-title" className="text-sm font-medium text-foreground">
                Title <span className="text-danger">*</span>
              </label>
              <Input
                id="log-activity-title"
                value={values.title}
                placeholder="What happened?"
                onChange={(event) => {
                  setValues((current) => ({ ...current, title: event.target.value }));
                  setErrors((current) => {
                    const { title: _removed, ...rest } = current;
                    return rest;
                  });
                }}
              />
              {errors.title ? <p className="text-xs text-danger">{errors.title}</p> : null}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="log-activity-description"
                className="text-sm font-medium text-foreground"
              >
                Description
              </label>
              <textarea
                id="log-activity-description"
                rows={4}
                value={values.description}
                placeholder="Optional details..."
                className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onChange={(event) => {
                  setValues((current) => ({ ...current, description: event.target.value }));
                }}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => {
                  onOpenChange(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="gap-2">
                {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Save activity
              </Button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
