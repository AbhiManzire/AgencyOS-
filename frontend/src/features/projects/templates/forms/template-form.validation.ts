import type {
  CreateProjectTemplatePayload,
  ProjectServiceType,
  ProjectTemplateRecord,
  UpdateProjectTemplatePayload,
} from '@/features/projects/templates/api/template.types';

export interface TemplateMilestoneDraft {
  name: string;
  description: string;
  offsetDays: string;
}

export interface TemplateTaskDraft {
  title: string;
  description: string;
  offsetDays: string;
  estimatedHours: string;
}

export interface TemplateFormValues {
  name: string;
  description: string;
  serviceType: ProjectServiceType;
  defaultDurationDays: string;
  defaultEstimatedHours: string;
  isActive: 'yes' | 'no';
  milestones: TemplateMilestoneDraft[];
  tasks: TemplateTaskDraft[];
}

export interface TemplateFormErrors {
  name?: string;
  description?: string;
  defaultDurationDays?: string;
  defaultEstimatedHours?: string;
  form?: string;
}

export const DEFAULT_TEMPLATE_FORM_VALUES: TemplateFormValues = {
  name: '',
  description: '',
  serviceType: 'CUSTOM',
  defaultDurationDays: '',
  defaultEstimatedHours: '',
  isActive: 'yes',
  milestones: [],
  tasks: [],
};

export function templateRecordToFormValues(record: ProjectTemplateRecord): TemplateFormValues {
  return {
    name: record.name,
    description: record.description ?? '',
    serviceType: record.serviceType,
    defaultDurationDays:
      record.defaultDurationDays !== null ? String(record.defaultDurationDays) : '',
    defaultEstimatedHours:
      record.defaultEstimatedHours !== null ? String(record.defaultEstimatedHours) : '',
    isActive: record.isActive ? 'yes' : 'no',
    milestones: record.milestones.map((milestone) => ({
      name: milestone.name,
      description: milestone.description ?? '',
      offsetDays: String(milestone.offsetDays),
    })),
    tasks: record.tasks.map((task) => ({
      title: task.title,
      description: task.description ?? '',
      offsetDays: String(task.offsetDays),
      estimatedHours:
        task.estimatedHours !== null && task.estimatedHours !== undefined
          ? String(task.estimatedHours)
          : '',
    })),
  };
}

export function areTemplateFormValuesEqual(
  left: TemplateFormValues,
  right: TemplateFormValues,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function validateTemplateForm(values: TemplateFormValues): TemplateFormErrors {
  const errors: TemplateFormErrors = {};

  if (values.name.trim().length === 0) {
    errors.name = 'Template name is required';
  } else if (values.name.trim().length > 255) {
    errors.name = 'Template name must be 255 characters or fewer';
  }

  if (values.description.trim().length > 5000) {
    errors.description = 'Description must be 5000 characters or fewer';
  }

  const duration = values.defaultDurationDays.trim();
  if (duration.length > 0) {
    const parsed = Number(duration);
    if (!Number.isInteger(parsed) || parsed < 0) {
      errors.defaultDurationDays = 'Duration must be a whole number ≥ 0';
    }
  }

  const hours = values.defaultEstimatedHours.trim();
  if (hours.length > 0) {
    const parsed = Number(hours);
    if (!Number.isFinite(parsed) || parsed < 0) {
      errors.defaultEstimatedHours = 'Estimated hours must be a number ≥ 0';
    }
  }

  return errors;
}

function mapMilestones(values: TemplateFormValues) {
  return values.milestones
    .filter((milestone) => milestone.name.trim().length > 0)
    .map((milestone, index) => ({
      name: milestone.name.trim(),
      description: milestone.description.trim().length > 0 ? milestone.description.trim() : null,
      offsetDays: Number(milestone.offsetDays.trim() || '0') || 0,
      sortOrder: index,
    }));
}

function mapTasks(values: TemplateFormValues) {
  return values.tasks
    .filter((task) => task.title.trim().length > 0)
    .map((task, index) => ({
      title: task.title.trim(),
      description: task.description.trim().length > 0 ? task.description.trim() : null,
      offsetDays: Number(task.offsetDays.trim() || '0') || 0,
      estimatedHours:
        task.estimatedHours.trim().length > 0 ? Number(task.estimatedHours.trim()) : null,
      sortOrder: index,
    }));
}

export function toCreateTemplatePayload(values: TemplateFormValues): CreateProjectTemplatePayload {
  const duration = values.defaultDurationDays.trim();
  const hours = values.defaultEstimatedHours.trim();
  const description = values.description.trim();

  return {
    name: values.name.trim(),
    serviceType: values.serviceType,
    isActive: values.isActive === 'yes',
    ...(description.length > 0 ? { description } : {}),
    ...(duration.length > 0 ? { defaultDurationDays: Number(duration) } : {}),
    ...(hours.length > 0 ? { defaultEstimatedHours: Number(hours) } : {}),
    milestones: mapMilestones(values),
    tasks: mapTasks(values),
  };
}

export function toUpdateTemplatePayload(values: TemplateFormValues): UpdateProjectTemplatePayload {
  const duration = values.defaultDurationDays.trim();
  const hours = values.defaultEstimatedHours.trim();
  const description = values.description.trim();

  return {
    name: values.name.trim(),
    serviceType: values.serviceType,
    isActive: values.isActive === 'yes',
    description: description.length > 0 ? description : null,
    defaultDurationDays: duration.length > 0 ? Number(duration) : null,
    defaultEstimatedHours: hours.length > 0 ? Number(hours) : null,
    milestones: mapMilestones(values),
    tasks: mapTasks(values),
  };
}
