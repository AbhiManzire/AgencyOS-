import type { SalesTaskPriority, SalesTaskStatus, SalesTaskType } from '@prisma/client';
import type { SalesTaskRecord } from '../repositories/sales-task.repository.interface';
import { SALES_TASK_DOMAIN_ERROR_CODES, SalesTaskDomainError } from './sales-task-domain.errors';
import {
  DEFAULT_DUE_TIME,
  DUE_TIME_PATTERN,
  type CreateSalesTaskValidationInput,
  type RescheduleSalesTaskValidationInput,
  type UpdateSalesTaskValidationInput,
} from './sales-task-domain.types';

const VALID_TYPES: readonly SalesTaskType[] = [
  'CALL',
  'MEETING',
  'EMAIL',
  'WHATSAPP',
  'PROPOSAL',
  'DOCUMENTATION',
  'INTERNAL',
  'CUSTOM',
];

const VALID_PRIORITIES: readonly SalesTaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const VALID_STATUSES: readonly SalesTaskStatus[] = ['PENDING', 'COMPLETED', 'CANCELLED', 'OVERDUE'];
const MUTABLE_STATUSES: readonly SalesTaskStatus[] = ['PENDING', 'OVERDUE'];

export class SalesTaskDomainService {
  validateCreate(input: CreateSalesTaskValidationInput): void {
    this.assertTitleRequired(input.title);
    this.assertTypeValid(input.type);
    this.assertOwnerRequired(input.ownerUserId);
    this.assertDueDateValid(input.dueDate);

    if (input.dueTime !== undefined && input.dueTime !== null) {
      this.assertDueTimeValid(input.dueTime);
    }

    if (input.priority !== undefined) {
      this.assertPriorityValid(input.priority);
    }

    if (input.status !== undefined && input.status !== 'PENDING') {
      throw new SalesTaskDomainError(
        SALES_TASK_DOMAIN_ERROR_CODES.INVALID_STATUS,
        'New sales tasks must start as PENDING.',
      );
    }

    this.computeDueAt(input.dueDate, input.dueTime);
  }

  validateUpdate(task: SalesTaskRecord, input: UpdateSalesTaskValidationInput): void {
    this.assertTaskIsMutable(task);

    if (input.title !== undefined) {
      this.assertTitleRequired(input.title);
    }

    if (input.type !== undefined) {
      this.assertTypeValid(input.type);
    }

    if (input.ownerUserId !== undefined) {
      this.assertOwnerRequired(input.ownerUserId);
    }

    if (input.dueDate !== undefined) {
      this.assertDueDateValid(input.dueDate);
    }

    if (input.dueTime !== undefined && input.dueTime !== null) {
      this.assertDueTimeValid(input.dueTime);
    }

    if (input.priority !== undefined) {
      this.assertPriorityValid(input.priority);
    }

    if (input.status !== undefined) {
      this.assertMutableStatus(input.status);
    }

    const dueDate = input.dueDate ?? formatDateOnlyUtc(task.dueDate);
    const dueTime = input.dueTime !== undefined ? input.dueTime : task.dueTime;
    this.computeDueAt(dueDate, dueTime);
  }

  validateReschedule(task: SalesTaskRecord, input: RescheduleSalesTaskValidationInput): void {
    this.assertTaskIsMutable(task);
    this.assertDueDateValid(input.dueDate);

    if (input.dueTime !== undefined && input.dueTime !== null) {
      this.assertDueTimeValid(input.dueTime);
    }

    this.computeDueAt(input.dueDate, input.dueTime);
  }

  validateReassign(task: SalesTaskRecord, ownerUserId: string): void {
    this.assertTaskIsMutable(task);
    this.assertOwnerRequired(ownerUserId);
  }

  validateComplete(task: SalesTaskRecord): void {
    this.assertTaskIsMutable(task);
  }

  validateCancel(task: SalesTaskRecord): void {
    this.assertTaskIsMutable(task);
  }

  normalizeRequiredString(value: string): string {
    return value.trim();
  }

  normalizeOptionalString(value: string | null | undefined): string | null | undefined {
    if (value === undefined) {
      return undefined;
    }
    if (value === null) {
      return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  resolveDueTime(dueTime: string | null | undefined): string {
    if (dueTime === null || dueTime === undefined || dueTime.trim().length === 0) {
      return DEFAULT_DUE_TIME;
    }
    return dueTime.trim();
  }

  computeDueAt(dueDate: string, dueTime: string | null | undefined): Date {
    this.assertDueDateValid(dueDate);
    const resolvedTime = this.resolveDueTime(dueTime);
    this.assertDueTimeValid(resolvedTime);

    const dueAt = new Date(`${dueDate}T${resolvedTime}:00.000Z`);
    if (Number.isNaN(dueAt.getTime())) {
      throw new SalesTaskDomainError(
        SALES_TASK_DOMAIN_ERROR_CODES.INVALID_DUE_AT,
        'Due date and time could not be combined into a valid UTC timestamp.',
      );
    }

    return dueAt;
  }

  parseDueDate(dueDate: string): Date {
    this.assertDueDateValid(dueDate);
    const parsed = new Date(`${dueDate}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime())) {
      throw new SalesTaskDomainError(
        SALES_TASK_DOMAIN_ERROR_CODES.INVALID_DUE_DATE,
        'Due date must be a valid ISO date (YYYY-MM-DD).',
      );
    }
    return parsed;
  }

  private assertTitleRequired(title: string): void {
    if (title.trim().length === 0) {
      throw new SalesTaskDomainError(
        SALES_TASK_DOMAIN_ERROR_CODES.TITLE_REQUIRED,
        'Sales task title is required.',
      );
    }
  }

  private assertOwnerRequired(ownerUserId: string): void {
    if (ownerUserId.trim().length === 0) {
      throw new SalesTaskDomainError(
        SALES_TASK_DOMAIN_ERROR_CODES.OWNER_REQUIRED,
        'Sales task owner is required.',
      );
    }
  }

  private assertDueDateValid(dueDate: string): void {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      throw new SalesTaskDomainError(
        SALES_TASK_DOMAIN_ERROR_CODES.INVALID_DUE_DATE,
        'Due date must be a valid ISO date (YYYY-MM-DD).',
      );
    }
  }

  private assertDueTimeValid(dueTime: string): void {
    if (!DUE_TIME_PATTERN.test(dueTime)) {
      throw new SalesTaskDomainError(
        SALES_TASK_DOMAIN_ERROR_CODES.INVALID_DUE_TIME,
        'Due time must match HH:mm.',
      );
    }

    const [hoursRaw, minutesRaw] = dueTime.split(':');
    const hours = Number(hoursRaw);
    const minutes = Number(minutesRaw);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new SalesTaskDomainError(
        SALES_TASK_DOMAIN_ERROR_CODES.INVALID_DUE_TIME,
        'Due time must be a valid 24-hour clock value.',
      );
    }
  }

  private assertTypeValid(type: SalesTaskType): void {
    if (!VALID_TYPES.includes(type)) {
      throw new SalesTaskDomainError(
        SALES_TASK_DOMAIN_ERROR_CODES.INVALID_TYPE,
        'Sales task type is invalid.',
      );
    }
  }

  private assertPriorityValid(priority: SalesTaskPriority): void {
    if (!VALID_PRIORITIES.includes(priority)) {
      throw new SalesTaskDomainError(
        SALES_TASK_DOMAIN_ERROR_CODES.INVALID_PRIORITY,
        'Sales task priority is invalid.',
      );
    }
  }

  private assertMutableStatus(status: SalesTaskStatus): void {
    if (!VALID_STATUSES.includes(status)) {
      throw new SalesTaskDomainError(
        SALES_TASK_DOMAIN_ERROR_CODES.INVALID_STATUS,
        'Sales task status is invalid.',
      );
    }

    if (status === 'COMPLETED' || status === 'CANCELLED') {
      throw new SalesTaskDomainError(
        SALES_TASK_DOMAIN_ERROR_CODES.INVALID_STATUS,
        'Use the complete or cancel endpoint to change terminal status.',
      );
    }
  }

  private assertTaskIsMutable(task: SalesTaskRecord): void {
    if (task.deletedAt !== null) {
      throw new SalesTaskDomainError(
        SALES_TASK_DOMAIN_ERROR_CODES.SALES_TASK_ARCHIVED,
        'Sales task is archived and cannot be modified.',
      );
    }

    if (!MUTABLE_STATUSES.includes(task.status)) {
      throw new SalesTaskDomainError(
        SALES_TASK_DOMAIN_ERROR_CODES.NOT_MUTABLE,
        'Sales task is not mutable in its current status.',
      );
    }
  }
}

export function formatDateOnlyUtc(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${String(year)}-${month}-${day}`;
}
