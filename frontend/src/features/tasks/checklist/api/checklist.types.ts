export interface TaskChecklistItemRecord {
  readonly id: string;
  readonly taskId: string;
  readonly title: string;
  readonly isCompleted: boolean;
  readonly sortOrder: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateTaskChecklistItemPayload {
  readonly title: string;
  readonly sortOrder?: number;
}

export interface UpdateTaskChecklistItemPayload {
  readonly title?: string;
  readonly isCompleted?: boolean;
  readonly sortOrder?: number;
}
