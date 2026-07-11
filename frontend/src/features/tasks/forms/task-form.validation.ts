import type { CreateTaskPayload, UpdateTaskPayload } from '@/features/tasks/api/task-payload.types';
import type { TaskRecord } from '@/features/tasks/api/task.types';
import type { TaskPriority, TaskStatus, TaskType } from '@/features/tasks/types';

export interface TaskFormValues {
  title: string;
  code: string;
  projectId: string;
  milestoneId: string;
  assigneeUserId: string;
  reporterUserId: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  startDate: string;
  dueDate: string;
  estimatedHours: string;
  actualHours: string;
  description: string;
}

export interface TaskFormErrors {
  title?: string;
  code?: string;
  projectId?: string;
  startDate?: string;
  dueDate?: string;
  estimatedHours?: string;
  actualHours?: string;
  description?: string;
  form?: string;
}

export const DEFAULT_TASK_FORM_VALUES: TaskFormValues = {
  title: '',
  code: '',
  projectId: '',
  milestoneId: '',
  assigneeUserId: '',
  reporterUserId: '',
  type: 'FEATURE',
  priority: 'MEDIUM',
  status: 'TODO',
  startDate: '',
  dueDate: '',
  estimatedHours: '',
  actualHours: '',
  description: '',
};

export const TASK_STATUS_OPTIONS: readonly TaskStatus[] = [
  'BACKLOG',
  'TODO',
  'IN_PROGRESS',
  'REVIEW',
  'BLOCKED',
  'COMPLETED',
  'CANCELLED',
];

export const TASK_PRIORITY_OPTIONS: readonly TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const TASK_TYPE_OPTIONS: readonly TaskType[] = [
  'FEATURE',
  'BUG',
  'IMPROVEMENT',
  'RESEARCH',
  'MEETING',
  'SUPPORT',
  'OTHER',
];

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseDateInput(value: string): Date | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const parsed = new Date(`${trimmed}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseNonNegativeHours(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const parsed = Number(trimmed);
  if (Number.isNaN(parsed) || parsed < 0) {
    return NaN;
  }

  return parsed;
}

export function taskRecordToFormValues(record: TaskRecord): TaskFormValues {
  return {
    title: record.title,
    code: record.code ?? '',
    projectId: record.projectId,
    milestoneId: record.milestoneId ?? '',
    assigneeUserId: record.assigneeUserId ?? '',
    reporterUserId: record.reporterUserId ?? '',
    type: record.type,
    priority: record.priority,
    status: record.status === 'ARCHIVED' ? 'TODO' : record.status,
    startDate: record.startDate ? record.startDate.slice(0, 10) : '',
    dueDate: record.dueDate ? record.dueDate.slice(0, 10) : '',
    estimatedHours: record.estimatedHours === null ? '' : String(record.estimatedHours),
    actualHours: record.actualHours === null ? '' : String(record.actualHours),
    description: record.description ?? '',
  };
}

export function areTaskFormValuesEqual(left: TaskFormValues, right: TaskFormValues): boolean {
  return (
    left.title === right.title &&
    left.code === right.code &&
    left.projectId === right.projectId &&
    left.milestoneId === right.milestoneId &&
    left.assigneeUserId === right.assigneeUserId &&
    left.reporterUserId === right.reporterUserId &&
    left.type === right.type &&
    left.priority === right.priority &&
    left.status === right.status &&
    left.startDate === right.startDate &&
    left.dueDate === right.dueDate &&
    left.estimatedHours === right.estimatedHours &&
    left.actualHours === right.actualHours &&
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

  const code = values.code.trim();
  if (code.length > 64) {
    errors.code = 'Code must be 64 characters or fewer';
  }

  const projectId = values.projectId.trim();
  if (projectId.length === 0) {
    errors.projectId = 'Project is required';
  } else if (!isEditMode && !UUID_PATTERN.test(projectId)) {
    errors.projectId = 'Select a valid project';
  }

  const description = values.description.trim();
  if (description.length > 5000) {
    errors.description = 'Description must be 5000 characters or fewer';
  }

  const estimatedHours = parseNonNegativeHours(values.estimatedHours);
  if (Number.isNaN(estimatedHours)) {
    errors.estimatedHours = 'Estimated hours must be zero or greater';
  }

  const actualHours = parseNonNegativeHours(values.actualHours);
  if (Number.isNaN(actualHours)) {
    errors.actualHours = 'Actual hours must be zero or greater';
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
  const actualHours = values.actualHours.trim();
  const code = values.code.trim();

  return {
    projectId: values.projectId.trim(),
    title: values.title.trim(),
    ...(code.length > 0 ? { code } : {}),
    ...(values.milestoneId.trim().length > 0 ? { milestoneId: values.milestoneId.trim() } : {}),
    ...(values.assigneeUserId.trim().length > 0
      ? { assigneeUserId: values.assigneeUserId.trim() }
      : {}),
    ...(values.reporterUserId.trim().length > 0
      ? { reporterUserId: values.reporterUserId.trim() }
      : {}),
    type: values.type,
    priority: values.priority,
    status: values.status,
    ...(values.startDate.trim().length > 0 ? { startDate: values.startDate.trim() } : {}),
    ...(values.dueDate.trim().length > 0 ? { dueDate: values.dueDate.trim() } : {}),
    ...(estimatedHours.length > 0 ? { estimatedHours: Number(estimatedHours) } : {}),
    ...(actualHours.length > 0 ? { actualHours: Number(actualHours) } : {}),
    ...(values.description.trim().length > 0 ? { description: values.description.trim() } : {}),
  };
}

export function toUpdateTaskPayload(values: TaskFormValues): UpdateTaskPayload {
  const estimatedHours = values.estimatedHours.trim();
  const actualHours = values.actualHours.trim();
  const code = values.code.trim();

  return {
    title: values.title.trim(),
    code: code.length > 0 ? code : null,
    description: values.description.trim().length > 0 ? values.description.trim() : null,
    milestoneId: values.milestoneId.trim().length > 0 ? values.milestoneId.trim() : null,
    assigneeUserId: values.assigneeUserId.trim().length > 0 ? values.assigneeUserId.trim() : null,
    reporterUserId: values.reporterUserId.trim().length > 0 ? values.reporterUserId.trim() : null,
    type: values.type,
    priority: values.priority,
    status: values.status,
    startDate: values.startDate.trim().length > 0 ? values.startDate.trim() : null,
    dueDate: values.dueDate.trim().length > 0 ? values.dueDate.trim() : null,
    estimatedHours: estimatedHours.length > 0 ? Number(estimatedHours) : null,
    actualHours: actualHours.length > 0 ? Number(actualHours) : null,
  };
}
