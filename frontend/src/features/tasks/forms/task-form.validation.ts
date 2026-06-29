import type { CreateTaskPayload, UpdateTaskPayload } from '@/features/tasks/api/task-payload.types';
import type { TaskRecord } from '@/features/tasks/api/task.types';
import type { TaskPriority, TaskStatus } from '@/features/tasks/types';

export interface TaskFormValues {
  title: string;
  projectId: string;
  milestoneId: string;
  assigneeUserId: string;
  priority: TaskPriority;
  status: TaskStatus;
  startDate: string;
  dueDate: string;
  estimatedHours: string;
  description: string;
}

export interface TaskFormErrors {
  title?: string;
  projectId?: string;
  startDate?: string;
  dueDate?: string;
  estimatedHours?: string;
  description?: string;
  form?: string;
}

export const DEFAULT_TASK_FORM_VALUES: TaskFormValues = {
  title: '',
  projectId: '',
  milestoneId: '',
  assigneeUserId: '',
  priority: 'NORMAL',
  status: 'TODO',
  startDate: '',
  dueDate: '',
  estimatedHours: '',
  description: '',
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseDateInput(value: string): Date | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const parsed = new Date(`${trimmed}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function taskRecordToFormValues(record: TaskRecord): TaskFormValues {
  return {
    title: record.title,
    projectId: record.projectId,
    milestoneId: record.milestoneId ?? '',
    assigneeUserId: record.assigneeUserId ?? '',
    priority: record.priority,
    status: record.status,
    startDate: record.startDate ? record.startDate.slice(0, 10) : '',
    dueDate: record.dueDate ? record.dueDate.slice(0, 10) : '',
    estimatedHours: record.estimatedHours === null ? '' : String(record.estimatedHours),
    description: record.description ?? '',
  };
}

export function areTaskFormValuesEqual(left: TaskFormValues, right: TaskFormValues): boolean {
  return (
    left.title === right.title &&
    left.projectId === right.projectId &&
    left.milestoneId === right.milestoneId &&
    left.assigneeUserId === right.assigneeUserId &&
    left.priority === right.priority &&
    left.status === right.status &&
    left.startDate === right.startDate &&
    left.dueDate === right.dueDate &&
    left.estimatedHours === right.estimatedHours &&
    left.description === right.description
  );
}

export function validateTaskForm(values: TaskFormValues, isEditMode: boolean): TaskFormErrors {
  const errors: TaskFormErrors = {};
  const title = values.title.trim();

  if (title.length === 0) {
    errors.title = 'Title is required';
  } else if (title.length > 255) {
    errors.title = 'Title must be 255 characters or fewer';
  }

  if (!isEditMode) {
    const projectId = values.projectId.trim();
    if (projectId.length === 0) {
      errors.projectId = 'Project is required';
    } else if (!UUID_PATTERN.test(projectId)) {
      errors.projectId = 'Select a valid project';
    }
  }

  const description = values.description.trim();
  if (description.length > 5000) {
    errors.description = 'Description must be 5000 characters or fewer';
  }

  const estimatedHours = values.estimatedHours.trim();
  if (estimatedHours.length > 0) {
    const parsed = Number(estimatedHours);
    if (Number.isNaN(parsed) || parsed < 0) {
      errors.estimatedHours = 'Estimated hours must be zero or greater';
    }
  }

  const startDate = parseDateInput(values.startDate);
  const dueDate = parseDateInput(values.dueDate);

  if (values.startDate.trim().length > 0 && startDate === null) {
    errors.startDate = 'Enter a valid start date';
  }

  if (values.dueDate.trim().length > 0 && dueDate === null) {
    errors.dueDate = 'Enter a valid due date';
  }

  if (startDate !== null && dueDate !== null && dueDate.getTime() < startDate.getTime()) {
    errors.dueDate = 'Due date must be on or after the start date';
  }

  return errors;
}

export function toCreateTaskPayload(values: TaskFormValues): CreateTaskPayload {
  const estimatedHours = values.estimatedHours.trim();

  return {
    projectId: values.projectId.trim(),
    title: values.title.trim(),
    ...(values.milestoneId.trim().length > 0 ? { milestoneId: values.milestoneId.trim() } : {}),
    ...(values.assigneeUserId.trim().length > 0
      ? { assigneeUserId: values.assigneeUserId.trim() }
      : {}),
    priority: values.priority,
    status: values.status,
    ...(values.startDate.trim().length > 0 ? { startDate: values.startDate.trim() } : {}),
    ...(values.dueDate.trim().length > 0 ? { dueDate: values.dueDate.trim() } : {}),
    ...(estimatedHours.length > 0 ? { estimatedHours: Number(estimatedHours) } : {}),
    ...(values.description.trim().length > 0 ? { description: values.description.trim() } : {}),
  };
}

export function toUpdateTaskPayload(values: TaskFormValues): UpdateTaskPayload {
  const estimatedHours = values.estimatedHours.trim();

  return {
    title: values.title.trim(),
    description: values.description.trim().length > 0 ? values.description.trim() : null,
    milestoneId: values.milestoneId.trim().length > 0 ? values.milestoneId.trim() : null,
    assigneeUserId: values.assigneeUserId.trim().length > 0 ? values.assigneeUserId.trim() : null,
    priority: values.priority,
    status: values.status,
    startDate: values.startDate.trim().length > 0 ? values.startDate.trim() : null,
    dueDate: values.dueDate.trim().length > 0 ? values.dueDate.trim() : null,
    estimatedHours: estimatedHours.length > 0 ? Number(estimatedHours) : null,
  };
}
