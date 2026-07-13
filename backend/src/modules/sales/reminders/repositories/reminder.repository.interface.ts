import type { Prisma, ReminderRecurrence, ReminderStatus } from '@prisma/client';

export const REMINDER_REPOSITORY = Symbol('REMINDER_REPOSITORY');

export interface ReminderScope {
  readonly tenantId: string;
  readonly workspaceId: string;
}

export interface ReminderRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly title: string;
  readonly body: string | null;
  readonly remindDate: Date;
  readonly remindTime: string;
  readonly remindAt: Date;
  readonly recurrence: ReminderRecurrence;
  readonly assignedUserId: string;
  readonly assignedUserDisplayName: string | null;
  readonly assignedUserEmail: string | null;
  readonly notificationEventKey: string;
  readonly entityType: string | null;
  readonly entityId: string | null;
  readonly status: ReminderStatus;
  readonly lastFiredAt: Date | null;
  readonly metadata: Prisma.JsonValue | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: Date | null;
  readonly deletedByUserId: string | null;
}

export interface CreateReminderData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly title: string;
  readonly body?: string | null;
  readonly remindDate: Date;
  readonly remindTime: string;
  readonly remindAt: Date;
  readonly recurrence?: ReminderRecurrence;
  readonly assignedUserId: string;
  readonly notificationEventKey: string;
  readonly entityType?: string | null;
  readonly entityId?: string | null;
  readonly status?: ReminderStatus;
  readonly metadata?: Prisma.InputJsonValue | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId?: string | null;
  readonly updatedByUserId?: string | null;
}

export interface UpdateReminderData {
  readonly title?: string;
  readonly body?: string | null;
  readonly remindDate?: Date;
  readonly remindTime?: string;
  readonly remindAt?: Date;
  readonly recurrence?: ReminderRecurrence;
  readonly assignedUserId?: string;
  readonly notificationEventKey?: string;
  readonly entityType?: string | null;
  readonly entityId?: string | null;
  readonly status?: ReminderStatus;
  readonly lastFiredAt?: Date | null;
  readonly metadata?: Prisma.InputJsonValue | null;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface SoftDeleteReminderData {
  readonly status: ReminderStatus;
  readonly deletedAt: Date;
  readonly deletedByUserId?: string | null;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface ListRemindersParams {
  readonly scope: ReminderScope;
  readonly skip?: number;
  readonly take?: number;
  readonly status?: ReminderStatus;
  readonly assignedUserId?: string;
  readonly entityType?: string;
  readonly entityId?: string;
}

export interface ListRemindersResult {
  readonly items: readonly ReminderRecord[];
  readonly total: number;
}

export interface ReminderRepository {
  create(data: CreateReminderData): Promise<ReminderRecord>;
  update(
    scope: ReminderScope,
    id: string,
    data: UpdateReminderData,
  ): Promise<ReminderRecord | null>;
  softDelete(
    scope: ReminderScope,
    id: string,
    data: SoftDeleteReminderData,
  ): Promise<ReminderRecord | null>;
  findById(scope: ReminderScope, id: string): Promise<ReminderRecord | null>;
  list(params: ListRemindersParams): Promise<ListRemindersResult>;
  findDue(now: Date, take?: number): Promise<readonly ReminderRecord[]>;
  markFired(
    id: string,
    data: {
      readonly status: ReminderStatus;
      readonly lastFiredAt: Date;
      readonly remindAt?: Date;
      readonly remindDate?: Date;
      readonly updatedAt: Date;
    },
  ): Promise<ReminderRecord | null>;
}
