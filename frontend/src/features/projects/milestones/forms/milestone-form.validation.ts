import type { MilestoneFormValues } from '@/features/projects/milestones/types';
import type { ProjectMilestoneListItem } from '@/features/projects/milestones/types';

export const DEFAULT_MILESTONE_FORM_VALUES: MilestoneFormValues = {
  name: '',
  description: '',
  status: 'PLANNED',
  startDate: '',
  dueDate: '',
  ownerUserId: '',
  completionPercent: '0',
  dependsOnMilestoneIds: [],
};

export function milestoneToFormValues(milestone: ProjectMilestoneListItem): MilestoneFormValues {
  return {
    name: milestone.name,
    description: milestone.description ?? '',
    status: milestone.status,
    startDate: milestone.startDate ? milestone.startDate.slice(0, 10) : '',
    dueDate: milestone.dueDate ? milestone.dueDate.slice(0, 10) : '',
    ownerUserId: milestone.ownerUserId ?? '',
    completionPercent: String(milestone.completionPercent),
    dependsOnMilestoneIds: [...milestone.dependsOnMilestoneIds],
  };
}

export function areMilestoneFormValuesEqual(
  left: MilestoneFormValues,
  right: MilestoneFormValues,
): boolean {
  return (
    left.name === right.name &&
    left.description === right.description &&
    left.status === right.status &&
    left.startDate === right.startDate &&
    left.dueDate === right.dueDate &&
    left.ownerUserId === right.ownerUserId &&
    left.completionPercent === right.completionPercent &&
    left.dependsOnMilestoneIds.join(',') === right.dependsOnMilestoneIds.join(',')
  );
}

export function validateMilestoneForm(values: MilestoneFormValues): Record<string, string> {
  const errors: Record<string, string> = {};

  if (values.name.trim().length === 0) {
    errors.name = 'Name is required';
  }

  if (values.startDate.trim().length > 0 && values.dueDate.trim().length > 0) {
    if (values.dueDate < values.startDate) {
      errors.dueDate = 'Due date must be on or after the start date';
    }
  }

  const completion = values.completionPercent.trim();
  if (completion.length > 0) {
    const parsed = Number(completion);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 100) {
      errors.completionPercent = 'Completion must be a whole number between 0 and 100';
    }
  }

  return errors;
}

export function toCreateMilestonePayload(values: MilestoneFormValues) {
  const completion = values.completionPercent.trim();

  return {
    name: values.name.trim(),
    ...(values.description.trim().length > 0 ? { description: values.description.trim() } : {}),
    status: values.status,
    ...(values.startDate.trim().length > 0 ? { startDate: values.startDate.trim() } : {}),
    ...(values.dueDate.trim().length > 0 ? { dueDate: values.dueDate.trim() } : {}),
    ...(values.ownerUserId.trim().length > 0 ? { ownerUserId: values.ownerUserId.trim() } : {}),
    ...(completion.length > 0 ? { completionPercent: Number(completion) } : {}),
    ...(values.dependsOnMilestoneIds.length > 0
      ? { dependsOnMilestoneIds: values.dependsOnMilestoneIds }
      : {}),
  };
}

export function toUpdateMilestonePayload(values: MilestoneFormValues) {
  const completion = values.completionPercent.trim();

  return {
    name: values.name.trim(),
    description: values.description.trim().length > 0 ? values.description.trim() : null,
    status: values.status,
    startDate: values.startDate.trim().length > 0 ? values.startDate.trim() : null,
    dueDate: values.dueDate.trim().length > 0 ? values.dueDate.trim() : null,
    ownerUserId: values.ownerUserId.trim().length > 0 ? values.ownerUserId.trim() : null,
    completionPercent: completion.length > 0 ? Number(completion) : 0,
    dependsOnMilestoneIds: values.dependsOnMilestoneIds,
  };
}
