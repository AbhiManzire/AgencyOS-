import type { Prisma } from '@prisma/client';
import type {
  WorkflowConditionOperator,
  WorkflowExecutionLogLevel,
  WorkflowExecutionStatus,
  WorkflowScheduleFrequency,
} from '@prisma/client';

export interface AutomationScope {
  readonly tenantId: string;
  readonly workspaceId: string;
}

export interface AutomationContext {
  readonly actorUserId: string;
}

export interface EnqueueExecutionInput {
  readonly workflowId: string;
  readonly triggerType?: string;
  readonly triggerPayload?: Record<string, unknown>;
  readonly triggeredByUserId?: string | null;
  readonly maxAttempts?: number;
}

export interface AppendLogInput {
  readonly level: WorkflowExecutionLogLevel;
  readonly stepKey?: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

export interface ListExecutionsQuery {
  readonly workflowId?: string;
  readonly status?: WorkflowExecutionStatus;
  readonly skip?: number;
  readonly take?: number;
}

export interface ListExecutionsResult {
  readonly items: readonly WorkflowExecutionRecord[];
  readonly total: number;
}

export interface WorkflowExecutionLogRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly executionId: string;
  readonly level: WorkflowExecutionLogLevel;
  readonly stepKey: string | null;
  readonly message: string;
  readonly details: Prisma.JsonValue | null;
  readonly occurredAt: Date;
  readonly createdAt: Date;
}

export interface WorkflowExecutionRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly workflowId: string;
  readonly status: WorkflowExecutionStatus;
  readonly triggerType: string | null;
  readonly triggerPayload: Prisma.JsonValue | null;
  readonly attempt: number;
  readonly maxAttempts: number;
  readonly nextRetryAt: Date | null;
  readonly startedAt: Date | null;
  readonly finishedAt: Date | null;
  readonly errorMessage: string | null;
  readonly triggeredByUserId: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface WorkflowExecutionWithLogsRecord extends WorkflowExecutionRecord {
  readonly logs: readonly WorkflowExecutionLogRecord[];
}

export interface WorkflowScheduleRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly workflowId: string;
  readonly frequency: WorkflowScheduleFrequency;
  readonly cronExpression: string | null;
  readonly timezone: string;
  readonly nextRunAt: Date | null;
  readonly lastRunAt: Date | null;
  readonly isActive: boolean;
  readonly config: Prisma.JsonValue;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
}

export interface ConditionSpec {
  readonly field: string;
  readonly operator: WorkflowConditionOperator;
  readonly value?: unknown;
}

export type TerminalExecutionStatus = Extract<
  WorkflowExecutionStatus,
  'SUCCEEDED' | 'FAILED' | 'SKIPPED' | 'CANCELLED'
>;

export const DEFAULT_MAX_ATTEMPTS = 3;
export const DEFAULT_RETRY_DELAY_MS = 1000;
