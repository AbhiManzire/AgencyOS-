import type { TaskScope } from '../../repositories/task.repository.interface';
import type { TaskChecklistItemRecord } from '../repositories/task-checklist-item.repository.interface';

export interface TaskChecklistApplicationContext {
  readonly actorUserId: string;
}

export interface CreateTaskChecklistItemCommand {
  readonly title: string;
  readonly isCompleted?: boolean;
  readonly sortOrder?: number;
}

export interface UpdateTaskChecklistItemCommand {
  readonly title?: string;
  readonly isCompleted?: boolean;
  readonly sortOrder?: number;
}

export type { TaskChecklistItemRecord, TaskScope };
