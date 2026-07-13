import type { MemberFormValues } from '@/features/projects/members/types';
import type { ProjectMemberListItem } from '@/features/projects/members/types';

export const DEFAULT_MEMBER_FORM_VALUES: MemberFormValues = {
  userId: '',
  role: 'DEVELOPER',
  customRoleLabel: '',
  allocationPercent: '',
  startDate: '',
};

export function memberToFormValues(member: ProjectMemberListItem): MemberFormValues {
  return {
    userId: member.userId,
    role: member.role,
    customRoleLabel: member.customRoleLabel ?? '',
    allocationPercent: member.allocationPercent === null ? '' : String(member.allocationPercent),
    startDate: member.assignedOn ? member.assignedOn.slice(0, 10) : '',
  };
}

export function areMemberFormValuesEqual(left: MemberFormValues, right: MemberFormValues): boolean {
  return (
    left.userId === right.userId &&
    left.role === right.role &&
    left.customRoleLabel === right.customRoleLabel &&
    left.allocationPercent === right.allocationPercent &&
    left.startDate === right.startDate
  );
}

export function validateMemberForm(
  values: MemberFormValues,
  isEditMode: boolean,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!isEditMode && values.userId.trim().length === 0) {
    errors.userId = 'Workspace user is required';
  }

  if (values.role === 'CUSTOM' && values.customRoleLabel.trim().length === 0) {
    errors.customRoleLabel = 'Custom role label is required when role is Custom';
  }

  const allocation = values.allocationPercent.trim();
  if (allocation.length > 0) {
    const parsed = Number(allocation);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 100) {
      errors.allocationPercent = 'Allocation must be a whole number between 0 and 100';
    }
  }

  return errors;
}

export function toCreateMemberPayload(values: MemberFormValues) {
  const allocation = values.allocationPercent.trim();
  const customRoleLabel = values.customRoleLabel.trim();

  return {
    userId: values.userId,
    role: values.role,
    ...(values.role === 'CUSTOM' && customRoleLabel.length > 0 ? { customRoleLabel } : {}),
    ...(allocation.length > 0 ? { allocationPercent: Number(allocation) } : {}),
    ...(values.startDate.trim().length > 0 ? { startDate: values.startDate.trim() } : {}),
  };
}

export function toUpdateMemberPayload(values: MemberFormValues) {
  const allocation = values.allocationPercent.trim();
  const customRoleLabel = values.customRoleLabel.trim();

  return {
    role: values.role,
    customRoleLabel:
      values.role === 'CUSTOM' ? (customRoleLabel.length > 0 ? customRoleLabel : null) : null,
    allocationPercent: allocation.length > 0 ? Number(allocation) : null,
    startDate: values.startDate.trim().length > 0 ? values.startDate.trim() : null,
  };
}

export function formatMemberName(member: Pick<ProjectMemberListItem, 'userDisplayName'>): string {
  return member.userDisplayName;
}
