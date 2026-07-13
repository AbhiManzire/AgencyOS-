import type { Prisma } from '@prisma/client';
import type {
  WorkflowConditionLogic,
  WorkflowConditionNodeType,
  WorkflowConditionOperator,
  WorkflowExecutionLogLevel,
  WorkflowExecutionStatus,
  WorkflowScheduleFrequency,
  WorkflowTriggerType,
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
  readonly recordEntityType?: string | null;
  readonly recordEntityId?: string | null;
  readonly scheduledFor?: Date | null;
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
  readonly recordEntityType: string | null;
  readonly recordEntityId: string | null;
  readonly attempt: number;
  readonly maxAttempts: number;
  readonly retryCount: number;
  readonly nextRetryAt: Date | null;
  readonly scheduledFor: Date | null;
  readonly startedAt: Date | null;
  readonly finishedAt: Date | null;
  readonly durationMs: number | null;
  readonly errorMessage: string | null;
  readonly result: Prisma.JsonValue | null;
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

export interface ConditionTreeNode {
  readonly id: string;
  readonly parentId: string | null;
  readonly nodeType: WorkflowConditionNodeType;
  readonly logic: WorkflowConditionLogic;
  readonly field?: string | null;
  readonly operator?: WorkflowConditionOperator | null;
  readonly value?: unknown;
  readonly sortOrder?: number;
}

export interface WorkflowDispatchInput {
  readonly scope: AutomationScope;
  readonly triggerType: WorkflowTriggerType;
  readonly payload: Record<string, unknown>;
  readonly entityType?: string;
  readonly entityId?: string;
  readonly actorUserId?: string;
  readonly customEventKey?: string;
}

export type TerminalExecutionStatus = Extract<
  WorkflowExecutionStatus,
  'SUCCEEDED' | 'FAILED' | 'SKIPPED' | 'CANCELLED'
>;

export const DEFAULT_MAX_ATTEMPTS = 3;
export const DEFAULT_RETRY_DELAY_MS = 1000;
