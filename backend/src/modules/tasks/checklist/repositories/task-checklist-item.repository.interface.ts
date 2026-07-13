import type { TaskScope } from '../../repositories/task.repository.interface';

export const TASK_CHECKLIST_ITEM_REPOSITORY = Symbol('TASK_CHECKLIST_ITEM_REPOSITORY');

export interface TaskChecklistItemScope extends TaskScope {
  readonly taskId: string;
}

export interface TaskChecklistItemRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly taskId: string;
  readonly title: string;
  readonly isCompleted: boolean;
  readonly sortOrder: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: Date | null;
  readonly deletedByUserId: string | null;
}

export interface CreateTaskChecklistItemData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly taskId: string;
  readonly title: string;
  readonly isCompleted?: boolean;
  readonly sortOrder: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId?: string | null;
  readonly updatedByUserId?: string | null;
}

export interface UpdateTaskChecklistItemData {
  readonly title?: string;
  readonly isCompleted?: boolean;
  readonly sortOrder?: number;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface SoftDeleteTaskChecklistItemData {
  readonly deletedAt: Date;
  readonly deletedByUserId: string;
  readonly updatedAt: Date;
  readonly updatedByUserId: string;
}

export interface TaskChecklistItemRepository {
  create(data: CreateTaskChecklistItemData): Promise<TaskChecklistItemRecord>;
  update(
    scope: TaskChecklistItemScope,
    id: string,
    data: UpdateTaskChecklistItemData,
  ): Promise<TaskChecklistItemRecord | null>;
  findById(scope: TaskChecklistItemScope, id: string): Promise<TaskChecklistItemRecord | null>;
  listByTask(scope: TaskChecklistItemScope): Promise<readonly TaskChecklistItemRecord[]>;
  getNextSortOrder(scope: TaskChecklistItemScope): Promise<number>;
  softDelete(
    scope: TaskChecklistItemScope,
    id: string,
    data: SoftDeleteTaskChecklistItemData,
  ): Promise<TaskChecklistItemRecord | null>;
}
