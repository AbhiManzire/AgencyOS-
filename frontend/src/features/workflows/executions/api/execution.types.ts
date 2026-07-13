import type {
  WorkflowExecutionLogLevel,
  WorkflowExecutionStatus,
} from '@/features/workflows/types';

export interface WorkflowExecutionLogRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly executionId: string;
  readonly level: WorkflowExecutionLogLevel;
  readonly stepKey: string | null;
  readonly message: string;
  readonly details: unknown;
  readonly occurredAt: string;
  readonly createdAt: string;
}

export interface WorkflowExecutionRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly workflowId: string;
  readonly status: WorkflowExecutionStatus;
  readonly triggerType: string | null;
  readonly triggerPayload: unknown;
  readonly recordEntityType?: string | null;
  readonly recordEntityId?: string | null;
  readonly attempt: number;
  readonly maxAttempts: number;
  readonly retryCount?: number;
  readonly nextRetryAt: string | null;
  readonly scheduledFor?: string | null;
  readonly startedAt: string | null;
  readonly finishedAt: string | null;
  readonly durationMs?: number | null;
  readonly errorMessage: string | null;
  readonly result?: unknown;
  readonly triggeredByUserId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface WorkflowExecutionWithLogsRecord extends WorkflowExecutionRecord {
  readonly logs: readonly WorkflowExecutionLogRecord[];
}

export interface ListExecutionsParams {
  readonly workflowId?: string;
  readonly status?: WorkflowExecutionStatus;
  readonly skip?: number;
  readonly take?: number;
}

export interface ListExecutionsResult {
  readonly items: readonly WorkflowExecutionRecord[];
  readonly total: number;
  readonly skip: number;
  readonly take: number;
}
