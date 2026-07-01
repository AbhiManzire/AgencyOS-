import type {
  CreateProjectPayload,
  ProjectRecord,
  UpdateProjectPayload,
} from '@/features/projects/api/project.types';
import type { ProjectStatus } from '@/features/projects/types';

export interface CreateProjectFormValues {
  name: string;
  clientId: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  projectManagerUserId: string;
  isBillable: 'yes' | 'no';
  description: string;
}

export type CreateProjectFormField = keyof Omit<CreateProjectFormValues, 'status' | 'isBillable'>;

export interface CreateProjectFormErrors {
  name?: string;
  clientId?: string;
  startDate?: string;
  endDate?: string;
  projectManagerUserId?: string;
  description?: string;
  form?: string;
}

export const DEFAULT_CREATE_PROJECT_FORM_VALUES: CreateProjectFormValues = {
  name: '',
  clientId: '',
  status: 'PLANNING',
  startDate: '',
  endDate: '',
  projectManagerUserId: '',
  isBillable: 'yes',
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

/** Validates create-project form values before submit. */
export function validateCreateProjectForm(
  values: CreateProjectFormValues,
): CreateProjectFormErrors {
  const errors: CreateProjectFormErrors = {};
  const name = values.name.trim();

  if (name.length === 0) {
    errors.name = 'Project name is required';
  } else if (name.length > 255) {
    errors.name = 'Project name must be 255 characters or fewer';
  }

  const clientId = values.clientId.trim();
  if (clientId.length === 0) {
    errors.clientId = 'Client is required';
  } else if (!UUID_PATTERN.test(clientId)) {
    errors.clientId = 'Select a valid client';
  }

  const projectManagerUserId = values.projectManagerUserId.trim();
  if (projectManagerUserId.length > 0 && !UUID_PATTERN.test(projectManagerUserId)) {
    errors.projectManagerUserId = 'Enter a valid project manager user ID';
  }

  const description = values.description.trim();
  if (description.length > 5000) {
    errors.description = 'Description must be 5000 characters or fewer';
  }

  const startDate = parseDateInput(values.startDate);
  const endDate = parseDateInput(values.endDate);

  if (values.startDate.trim().length > 0 && startDate === null) {
    errors.startDate = 'Enter a valid start date';
  }

  if (values.endDate.trim().length > 0 && endDate === null) {
    errors.endDate = 'Enter a valid end date';
  }

  if (startDate !== null && endDate !== null && endDate.getTime() < startDate.getTime()) {
    errors.endDate = 'End date must be on or after the start date';
  }

  return errors;
}

/** Returns true when form values differ from the loaded baseline. */
export function areProjectFormValuesEqual(
  left: CreateProjectFormValues,
  right: CreateProjectFormValues,
): boolean {
  return (
    left.name === right.name &&
    left.clientId === right.clientId &&
    left.status === right.status &&
    left.startDate === right.startDate &&
    left.endDate === right.endDate &&
    left.projectManagerUserId === right.projectManagerUserId &&
    left.isBillable === right.isBillable &&
    left.description === right.description
  );
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNING: 'Planning',
  ACTIVE: 'Active',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Completed',
  INVOICE_READY: 'Invoice Ready',
  CANCELLED: 'Cancelled',
};

/** Maps a project record to editable form values. */
export function projectRecordToFormValues(record: ProjectRecord): CreateProjectFormValues {
  return {
    name: record.name,
    clientId: record.clientId,
    status: record.status,
    startDate: record.startDate !== null ? record.startDate.slice(0, 10) : '',
    endDate: record.targetEndDate !== null ? record.targetEndDate.slice(0, 10) : '',
    projectManagerUserId: record.projectManagerUserId ?? '',
    isBillable: record.isBillable ? 'yes' : 'no',
    description: record.description ?? '',
  };
}

/** Maps validated form values to the PATCH /projects/:id request body. */
export function toUpdateProjectPayload(values: CreateProjectFormValues): UpdateProjectPayload {
  const description = values.description.trim();
  const projectManagerUserId = values.projectManagerUserId.trim();
  const startDate = values.startDate.trim();
  const endDate = values.endDate.trim();

  return {
    name: values.name.trim(),
    status: values.status,
    isBillable: values.isBillable === 'yes',
    description: description.length > 0 ? description : null,
    projectManagerUserId: projectManagerUserId.length > 0 ? projectManagerUserId : null,
    startDate: startDate.length > 0 ? startDate : null,
    targetEndDate: endDate.length > 0 ? endDate : null,
  };
}

/** Maps validated form values to the POST /projects request body. */
export function toCreateProjectPayload(values: CreateProjectFormValues): CreateProjectPayload {
  const description = values.description.trim();
  const projectManagerUserId = values.projectManagerUserId.trim();
  const startDate = values.startDate.trim();
  const endDate = values.endDate.trim();

  return {
    clientId: values.clientId.trim(),
    name: values.name.trim(),
    status: values.status,
    isBillable: values.isBillable === 'yes',
    ...(description.length > 0 ? { description } : {}),
    ...(projectManagerUserId.length > 0 ? { projectManagerUserId } : {}),
    ...(startDate.length > 0 ? { startDate } : {}),
    ...(endDate.length > 0 ? { targetEndDate: endDate } : {}),
  };
}

/** Maps API validation field names to form field keys. */
export function mapApiFieldToFormField(field: string): CreateProjectFormField | 'form' | null {
  switch (field) {
    case 'name':
      return 'name';
    case 'clientId':
      return 'clientId';
    case 'description':
      return 'description';
    case 'projectManagerUserId':
      return 'projectManagerUserId';
    case 'startDate':
      return 'startDate';
    case 'targetEndDate':
      return 'endDate';
    default:
      return null;
  }
}
