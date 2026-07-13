import type {
  CreateProjectPayload,
  ProjectRecord,
  UpdateProjectPayload,
} from '@/features/projects/api/project.types';
import type { ProjectServiceType } from '@/features/projects/templates/api/template.types';
import type { ProjectPriority, ProjectStatus } from '@/features/projects/types';

export interface CreateProjectFormValues {
  name: string;
  code: string;
  clientId: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate: string;
  endDate: string;
  projectManagerUserId: string;
  departmentId: string;
  budgetAmount: string;
  estimatedHours: string;
  actualHours: string;
  isBillable: 'yes' | 'no';
  description: string;
  tags: string;
  templateId: string;
  serviceType: '' | ProjectServiceType;
  primaryContactId: string;
}

export type CreateProjectFormField = keyof Omit<
  CreateProjectFormValues,
  'status' | 'isBillable' | 'priority'
>;

export interface CreateProjectFormErrors {
  name?: string;
  code?: string;
  clientId?: string;
  startDate?: string;
  endDate?: string;
  projectManagerUserId?: string;
  departmentId?: string;
  budgetAmount?: string;
  estimatedHours?: string;
  actualHours?: string;
  description?: string;
  tags?: string;
  templateId?: string;
  serviceType?: string;
  primaryContactId?: string;
  form?: string;
}

export const DEFAULT_CREATE_PROJECT_FORM_VALUES: CreateProjectFormValues = {
  name: '',
  code: '',
  clientId: '',
  status: 'PLANNING',
  priority: 'NORMAL',
  startDate: '',
  endDate: '',
  projectManagerUserId: '',
  departmentId: '',
  budgetAmount: '',
  estimatedHours: '',
  actualHours: '',
  isBillable: 'yes',
  description: '',
  tags: '',
  templateId: '',
  serviceType: '',
  primaryContactId: '',
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

function parseNonNegativeNumber(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return Number.NaN;
  }

  return parsed;
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

  const code = values.code.trim();
  if (code.length > 50) {
    errors.code = 'Project code must be 50 characters or fewer';
  }

  const clientId = values.clientId.trim();
  if (clientId.length === 0) {
    errors.clientId = 'Client is required';
  } else if (!UUID_PATTERN.test(clientId)) {
    errors.clientId = 'Select a valid client';
  }

  const projectManagerUserId = values.projectManagerUserId.trim();
  if (projectManagerUserId.length === 0) {
    errors.projectManagerUserId = 'Project owner is required';
  } else if (!UUID_PATTERN.test(projectManagerUserId)) {
    errors.projectManagerUserId = 'Select a valid project owner';
  }

  const departmentId = values.departmentId.trim();
  if (departmentId.length > 0 && !UUID_PATTERN.test(departmentId)) {
    errors.departmentId = 'Select a valid department';
  }

  const description = values.description.trim();
  if (description.length > 5000) {
    errors.description = 'Description must be 5000 characters or fewer';
  }

  const budgetAmount = parseNonNegativeNumber(values.budgetAmount);
  if (Number.isNaN(budgetAmount)) {
    errors.budgetAmount = 'Budget must be a number greater than or equal to zero';
  }

  const estimatedHours = parseNonNegativeNumber(values.estimatedHours);
  if (Number.isNaN(estimatedHours)) {
    errors.estimatedHours = 'Estimated hours must be a number greater than or equal to zero';
  }

  const actualHours = parseNonNegativeNumber(values.actualHours);
  if (Number.isNaN(actualHours)) {
    errors.actualHours = 'Actual hours must be a number greater than or equal to zero';
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
    left.code === right.code &&
    left.clientId === right.clientId &&
    left.status === right.status &&
    left.priority === right.priority &&
    left.startDate === right.startDate &&
    left.endDate === right.endDate &&
    left.projectManagerUserId === right.projectManagerUserId &&
    left.departmentId === right.departmentId &&
    left.budgetAmount === right.budgetAmount &&
    left.estimatedHours === right.estimatedHours &&
    left.actualHours === right.actualHours &&
    left.isBillable === right.isBillable &&
    left.description === right.description &&
    left.tags === right.tags &&
    left.templateId === right.templateId &&
    left.serviceType === right.serviceType &&
    left.primaryContactId === right.primaryContactId
  );
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNING: 'Planning',
  ACTIVE: 'Active',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Completed',
  INVOICE_READY: 'Invoice Ready',
  CANCELLED: 'Cancelled',
  ARCHIVED: 'Archived',
};

export const PROJECT_PRIORITY_LABELS: Record<ProjectPriority, string> = {
  LOW: 'Low',
  NORMAL: 'Normal',
  HIGH: 'High',
  URGENT: 'Urgent',
};

/** Maps a project record to editable form values. */
export function projectRecordToFormValues(record: ProjectRecord): CreateProjectFormValues {
  return {
    name: record.name,
    code: record.code ?? '',
    clientId: record.clientId,
    status: record.status === 'ARCHIVED' ? 'PLANNING' : record.status,
    priority: record.priority,
    startDate: record.startDate !== null ? record.startDate.slice(0, 10) : '',
    endDate: record.targetEndDate !== null ? record.targetEndDate.slice(0, 10) : '',
    projectManagerUserId: record.projectManagerUserId ?? '',
    departmentId: record.departmentId ?? '',
    budgetAmount: record.budgetAmount !== null ? String(record.budgetAmount) : '',
    estimatedHours: record.estimatedHours !== null ? String(record.estimatedHours) : '',
    actualHours: record.actualHours !== null ? String(record.actualHours) : '',
    isBillable: record.isBillable ? 'yes' : 'no',
    description: record.description ?? '',
    tags: '',
    templateId: record.templateId ?? '',
    serviceType: record.serviceType ?? '',
    primaryContactId: record.primaryContactId ?? '',
  };
}

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }

  return Number(trimmed);
}

/** Maps validated form values to the PATCH /projects/:id request body. */
export function toUpdateProjectPayload(values: CreateProjectFormValues): UpdateProjectPayload {
  const description = values.description.trim();
  const code = values.code.trim();
  const projectManagerUserId = values.projectManagerUserId.trim();
  const departmentId = values.departmentId.trim();
  const startDate = values.startDate.trim();
  const endDate = values.endDate.trim();
  const budgetAmount = parseOptionalNumber(values.budgetAmount);
  const estimatedHours = parseOptionalNumber(values.estimatedHours);
  const actualHours = parseOptionalNumber(values.actualHours);

  const templateId = values.templateId.trim();
  const primaryContactId = values.primaryContactId.trim();

  return {
    name: values.name.trim(),
    status: values.status,
    priority: values.priority,
    isBillable: values.isBillable === 'yes',
    projectManagerUserId,
    code: code.length > 0 ? code : null,
    description: description.length > 0 ? description : null,
    departmentId: departmentId.length > 0 ? departmentId : null,
    startDate: startDate.length > 0 ? startDate : null,
    targetEndDate: endDate.length > 0 ? endDate : null,
    budgetAmount: budgetAmount ?? null,
    estimatedHours: estimatedHours ?? null,
    actualHours: actualHours ?? null,
    templateId: templateId.length > 0 ? templateId : null,
    primaryContactId: primaryContactId.length > 0 ? primaryContactId : null,
    serviceType: values.serviceType === '' ? null : values.serviceType,
  };
}

/** Maps validated form values to the POST /projects request body. */
export function toCreateProjectPayload(values: CreateProjectFormValues): CreateProjectPayload {
  const description = values.description.trim();
  const code = values.code.trim();
  const departmentId = values.departmentId.trim();
  const startDate = values.startDate.trim();
  const endDate = values.endDate.trim();
  const budgetAmount = parseOptionalNumber(values.budgetAmount);
  const estimatedHours = parseOptionalNumber(values.estimatedHours);
  const actualHours = parseOptionalNumber(values.actualHours);

  const templateId = values.templateId.trim();
  const primaryContactId = values.primaryContactId.trim();

  return {
    clientId: values.clientId.trim(),
    name: values.name.trim(),
    projectManagerUserId: values.projectManagerUserId.trim(),
    status: values.status,
    priority: values.priority,
    isBillable: values.isBillable === 'yes',
    ...(code.length > 0 ? { code } : {}),
    ...(description.length > 0 ? { description } : {}),
    ...(departmentId.length > 0 ? { departmentId } : {}),
    ...(startDate.length > 0 ? { startDate } : {}),
    ...(endDate.length > 0 ? { targetEndDate: endDate } : {}),
    ...(budgetAmount !== undefined ? { budgetAmount } : {}),
    ...(estimatedHours !== undefined ? { estimatedHours } : {}),
    ...(actualHours !== undefined ? { actualHours } : {}),
    ...(templateId.length > 0 ? { templateId } : {}),
    ...(primaryContactId.length > 0 ? { primaryContactId } : {}),
    ...(values.serviceType === '' ? {} : { serviceType: values.serviceType }),
  };
}

/** Parses comma-separated tag names from the form. */
export function parseTagNames(tags: string): readonly string[] {
  return tags
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

/** Maps API validation field names to form field keys. */
export function mapApiFieldToFormField(field: string): CreateProjectFormField | 'form' | null {
  switch (field) {
    case 'name':
      return 'name';
    case 'code':
      return 'code';
    case 'clientId':
      return 'clientId';
    case 'description':
      return 'description';
    case 'projectManagerUserId':
      return 'projectManagerUserId';
    case 'departmentId':
      return 'departmentId';
    case 'budgetAmount':
      return 'budgetAmount';
    case 'estimatedHours':
      return 'estimatedHours';
    case 'actualHours':
      return 'actualHours';
    case 'startDate':
      return 'startDate';
    case 'targetEndDate':
      return 'endDate';
    default:
      return null;
  }
}
