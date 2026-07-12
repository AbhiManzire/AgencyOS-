import type {
  ScheduledReportExportFormat,
  ScheduledReportFrequency,
  ScheduledReportRunStatus,
} from '@prisma/client';
import type { ReportsScope, ScheduledReportRecord } from '../reports.types';

export const SCHEDULED_REPORT_REPOSITORY = Symbol('SCHEDULED_REPORT_REPOSITORY');

export interface CreateScheduledReportData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly name: string;
  readonly reportType: string;
  readonly frequency: ScheduledReportFrequency;
  readonly exportFormat: ScheduledReportExportFormat;
  readonly recipientEmails: readonly string[];
  readonly filters: Record<string, unknown>;
  readonly isActive: boolean;
  readonly nextRunAt: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
}

export interface UpdateScheduledReportData {
  readonly name?: string;
  readonly reportType?: string;
  readonly frequency?: ScheduledReportFrequency;
  readonly exportFormat?: ScheduledReportExportFormat;
  readonly recipientEmails?: readonly string[];
  readonly filters?: Record<string, unknown>;
  readonly isActive?: boolean;
  readonly nextRunAt?: Date;
  readonly lastRunAt?: Date | null;
  readonly lastStatus?: ScheduledReportRunStatus | null;
  readonly lastError?: string | null;
  readonly updatedAt: Date;
  readonly updatedByUserId: string | null;
}

export interface SoftDeleteScheduledReportData {
  readonly deletedAt: Date;
  readonly deletedByUserId: string | null;
  readonly updatedAt: Date;
  readonly updatedByUserId: string | null;
}

export interface ListScheduledReportsParams {
  readonly scope: ReportsScope;
  readonly skip?: number;
  readonly take?: number;
  readonly isActive?: boolean;
}

export interface ListScheduledReportsResult {
  readonly items: readonly ScheduledReportRecord[];
  readonly total: number;
}

export interface ScheduledReportRepository {
  create(data: CreateScheduledReportData): Promise<ScheduledReportRecord>;
  findById(scope: ReportsScope, id: string): Promise<ScheduledReportRecord | null>;
  list(params: ListScheduledReportsParams): Promise<ListScheduledReportsResult>;
  update(
    scope: ReportsScope,
    id: string,
    data: UpdateScheduledReportData,
  ): Promise<ScheduledReportRecord | null>;
  softDelete(
    scope: ReportsScope,
    id: string,
    data: SoftDeleteScheduledReportData,
  ): Promise<ScheduledReportRecord | null>;
  findDueActive(asOf: Date, take?: number): Promise<readonly ScheduledReportRecord[]>;
}
