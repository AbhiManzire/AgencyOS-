export interface ActivityRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly userId: string | null;
  readonly type: string;
  readonly title: string;
  readonly description: string | null;
  readonly metadata: Record<string, unknown> | null;
  readonly createdAt: string;
}

export interface ListActivitiesParams {
  readonly entityType: string;
  readonly entityId: string;
  readonly skip?: number;
  readonly take?: number;
}

export interface ListActivitiesResult {
  readonly items: readonly ActivityRecord[];
  readonly total: number;
  readonly skip: number;
  readonly take: number;
}
