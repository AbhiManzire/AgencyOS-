import type {
  CreateSubtaskPayload,
  UpdateSubtaskPayload,
} from '@/features/tasks/subtasks/api/subtask.types';
import type {
  SubtaskFormErrors,
  SubtaskFormValues,
  SubtaskListItem,
} from '@/features/tasks/subtasks/types';
import type { TaskPriority, TaskStatus } from '@/features/tasks/types';

export const DEFAULT_SUBTASK_FORM_VALUES: SubtaskFormValues = {
  title: '',
  assigneeUserId: '',
  priority: 'MEDIUM',
  status: 'TODO',
  dueDate: '',
};

function parseDateInput(value: string): Date | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const parsed = new Date(`${trimmed}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function subtaskToFormValues(subtask: SubtaskListItem): SubtaskFormValues {
  return {
    title: subtask.title,
    assigneeUserId: subtask.assigneeUserId ?? '',
    priority: subtask.priority,
    status: subtask.status,
    dueDate: subtask.dueDate ? subtask.dueDate.slice(0, 10) : '',
  };
}

export function areSubtaskFormValuesEqual(
  left: SubtaskFormValues,
  right: SubtaskFormValues,
): boolean {
  return (
    left.title === right.title &&
    left.assigneeUserId === right.assigneeUserId &&
    left.priority === right.priority &&
    left.status === right.status &&
    left.dueDate === right.dueDate
  );
}

export function validateSubtaskForm(values: SubtaskFormValues): SubtaskFormErrors {
  const errors: SubtaskFormErrors = {};

  if (values.title.trim().length === 0) {
    errors.title = 'Title is required.';
  } else if (values.title.trim().length > 255) {
    errors.title = 'Title must be 255 characters or fewer.';
  }

  if (values.dueDate.trim().length > 0 && parseDateInput(values.dueDate) === null) {
    errors.dueDate = 'Enter a valid due date.';
  }

  return errors;
}

function optionalAssignee(value: string): string | null | undefined {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function optionalDueDate(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export function toCreateSubtaskPayload(values: SubtaskFormValues): CreateSubtaskPayload {
  return {
    title: values.title.trim(),
    assigneeUserId: optionalAssignee(values.assigneeUserId),
    priority: values.priority,
    status: values.status,
    dueDate: optionalDueDate(values.dueDate),
  };
}

export function toUpdateSubtaskPayload(values: SubtaskFormValues): UpdateSubtaskPayload {
  return {
    title: values.title.trim(),
    assigneeUserId: optionalAssignee(values.assigneeUserId),
    priority: values.priority,
    status: values.status,
    dueDate: optionalDueDate(values.dueDate),
  };
}

export const TASK_STATUS_OPTIONS = [
  'BACKLOG',
  'TODO',
  'IN_PROGRESS',
  'REVIEW',
  'BLOCKED',
  'COMPLETED',
  'CANCELLED',
] as const satisfies readonly TaskStatus[];

export const TASK_PRIORITY_OPTIONS = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
] as const satisfies readonly TaskPriority[];
