'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { createEmptyActionItem } from '@/features/workflows/forms/workflow-form.validation';
import type {
  WorkflowActionDelayType,
  WorkflowActionFormItem,
  WorkflowActionType,
} from '@/features/workflows/types';
import { WORKFLOW_ACTION_DELAY_OPTIONS, WORKFLOW_ACTION_OPTIONS } from '@/features/workflows/types';

interface WorkflowActionsEditorProps {
  readonly actions: readonly WorkflowActionFormItem[];
  readonly disabled?: boolean;
  readonly onChange: (actions: readonly WorkflowActionFormItem[]) => void;
}

const TEXTAREA_CLASS =
  'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

function updateAction(
  actions: readonly WorkflowActionFormItem[],
  key: string,
  patch: Partial<WorkflowActionFormItem>,
): WorkflowActionFormItem[] {
  return actions.map((action) => (action.key === key ? { ...action, ...patch } : action));
}

/** Editable list of workflow actions with config fields and delay controls. */
export function WorkflowActionsEditor({
  actions,
  disabled = false,
  onChange,
}: WorkflowActionsEditorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">Actions</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className="gap-1"
          onClick={() => {
            onChange([...actions, createEmptyActionItem()]);
          }}
        >
          <Plus className="size-3.5" />
          Add action
        </Button>
      </div>

      {actions.length === 0 ? (
        <p className="text-sm text-muted-foreground">Add at least one action.</p>
      ) : (
        <div className="space-y-3">
          {actions.map((action, index) => (
            <div key={action.key} className="space-y-3 rounded-md border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Action {index + 1}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled || actions.length <= 1}
                  onClick={() => {
                    onChange(actions.filter((item) => item.key !== action.key));
                  }}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Type</label>
                  <NativeSelect
                    value={action.type}
                    disabled={disabled}
                    aria-label={`Action ${String(index + 1)} type`}
                    onChange={(event) => {
                      onChange(
                        updateAction(actions, action.key, {
                          type: event.target.value as WorkflowActionType,
                        }),
                      );
                    }}
                  >
                    {WORKFLOW_ACTION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Delay</label>
                  <NativeSelect
                    value={action.delayType}
                    disabled={disabled}
                    aria-label={`Action ${String(index + 1)} delay type`}
                    onChange={(event) => {
                      onChange(
                        updateAction(actions, action.key, {
                          delayType: event.target.value as WorkflowActionDelayType,
                        }),
                      );
                    }}
                  >
                    {WORKFLOW_ACTION_DELAY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
              </div>

              {action.delayType !== 'IMMEDIATE' ? (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    {action.delayType === 'SPECIFIC_DATE' ? 'Delay until' : 'Delay value'}
                  </label>
                  <Input
                    type={action.delayType === 'SPECIFIC_DATE' ? 'datetime-local' : 'number'}
                    value={action.delayValue}
                    disabled={disabled}
                    placeholder={action.delayType === 'SPECIFIC_DATE' ? undefined : 'e.g. 15'}
                    onChange={(event) => {
                      onChange(
                        updateAction(actions, action.key, { delayValue: event.target.value }),
                      );
                    }}
                  />
                </div>
              ) : null}

              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  placeholder="ownerUserId"
                  value={action.ownerUserId}
                  disabled={disabled}
                  onChange={(event) => {
                    onChange(
                      updateAction(actions, action.key, { ownerUserId: event.target.value }),
                    );
                  }}
                />
                <Input
                  placeholder="status"
                  value={action.status}
                  disabled={disabled}
                  onChange={(event) => {
                    onChange(updateAction(actions, action.key, { status: event.target.value }));
                  }}
                />
                <Input
                  placeholder="title"
                  value={action.title}
                  disabled={disabled}
                  onChange={(event) => {
                    onChange(updateAction(actions, action.key, { title: event.target.value }));
                  }}
                />
                <Input
                  placeholder="url (webhook)"
                  value={action.url}
                  disabled={disabled}
                  onChange={(event) => {
                    onChange(updateAction(actions, action.key, { url: event.target.value }));
                  }}
                />
                <Input
                  placeholder="field"
                  value={action.field}
                  disabled={disabled}
                  onChange={(event) => {
                    onChange(updateAction(actions, action.key, { field: event.target.value }));
                  }}
                />
                <Input
                  placeholder="value"
                  value={action.value}
                  disabled={disabled}
                  onChange={(event) => {
                    onChange(updateAction(actions, action.key, { value: event.target.value }));
                  }}
                />
                <Input
                  placeholder="tags (comma-separated)"
                  value={action.tags}
                  disabled={disabled}
                  onChange={(event) => {
                    onChange(updateAction(actions, action.key, { tags: event.target.value }));
                  }}
                />
                <Input
                  placeholder="actionKey"
                  value={action.actionKey}
                  disabled={disabled}
                  onChange={(event) => {
                    onChange(updateAction(actions, action.key, { actionKey: event.target.value }));
                  }}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Extra config (JSON)
                </label>
                <textarea
                  rows={3}
                  value={action.configJson}
                  disabled={disabled}
                  className={TEXTAREA_CLASS}
                  placeholder='{"key":"value"}'
                  onChange={(event) => {
                    onChange(updateAction(actions, action.key, { configJson: event.target.value }));
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
