import { Injectable } from '@nestjs/common';
import type { Prisma, ScheduledReport } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { ReportsScope, ScheduledReportRecord } from '../reports.types';
import type {
  CreateScheduledReportData,
  ListScheduledReportsParams,
  ListScheduledReportsResult,
  ScheduledReportRepository,
  SoftDeleteScheduledReportData,
  UpdateScheduledReportData,
} from './scheduled-report.repository.interface';

@Injectable()
export class PrismaScheduledReportRepository implements ScheduledReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateScheduledReportData): Promise<ScheduledReportRecord> {
    const created = await this.prisma.scheduledReport.create({
      data: {
        id: data.id,
        tenantId: data.tenantId,
        workspaceId: data.workspaceId,
        name: data.name,
        reportType: data.reportType,
        frequency: data.frequency,
        exportFormat: data.exportFormat,
        recipientEmails: [...data.recipientEmails],
        filters: data.filters as Prisma.InputJsonValue,
        isActive: data.isActive,
        nextRunAt: data.nextRunAt,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        createdByUserId: data.createdByUserId,
        updatedByUserId: data.updatedByUserId,
      },
    });

    return mapScheduledReport(created);
  }

  async findById(scope: ReportsScope, id: string): Promise<ScheduledReportRecord | null> {
    const row = await this.prisma.scheduledReport.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
      },
    });

    return row === null ? null : mapScheduledReport(row);
  }

  async list(params: ListScheduledReportsParams): Promise<ListScheduledReportsResult> {
    const where: Prisma.ScheduledReportWhereInput = {
      tenantId: params.scope.tenantId,
      workspaceId: params.scope.workspaceId,
      deletedAt: null,
      ...(params.isActive !== undefined ? { isActive: params.isActive } : {}),
    };

    const skip = params.skip ?? 0;
    const take = params.take ?? 25;

    const [items, total] = await Promise.all([
      this.prisma.scheduledReport.findMany({
        where,
        orderBy: { nextRunAt: 'asc' },
        skip,
        take,
      }),
      this.prisma.scheduledReport.count({ where }),
    ]);

    return {
      items: items.map(mapScheduledReport),
      total,
    };
  }

  async update(
    scope: ReportsScope,
    id: string,
    data: UpdateScheduledReportData,
  ): Promise<ScheduledReportRecord | null> {
    const existing = await this.findById(scope, id);
    if (existing === null) {
      return null;
    }

    const updated = await this.prisma.scheduledReport.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.reportType !== undefined ? { reportType: data.reportType } : {}),
        ...(data.frequency !== undefined ? { frequency: data.frequency } : {}),
        ...(data.exportFormat !== undefined ? { exportFormat: data.exportFormat } : {}),
        ...(data.recipientEmails !== undefined
          ? { recipientEmails: [...data.recipientEmails] }
          : {}),
        ...(data.filters !== undefined ? { filters: data.filters as Prisma.InputJsonValue } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(data.nextRunAt !== undefined ? { nextRunAt: data.nextRunAt } : {}),
        ...(data.lastRunAt !== undefined ? { lastRunAt: data.lastRunAt } : {}),
        ...(data.lastStatus !== undefined ? { lastStatus: data.lastStatus } : {}),
        ...(data.lastError !== undefined ? { lastError: data.lastError } : {}),
        updatedAt: data.updatedAt,
        updatedByUserId: data.updatedByUserId,
      },
    });

    return mapScheduledReport(updated);
  }

  async softDelete(
    scope: ReportsScope,
    id: string,
    data: SoftDeleteScheduledReportData,
  ): Promise<ScheduledReportRecord | null> {
    const existing = await this.findById(scope, id);
    if (existing === null) {
      return null;
    }

    const updated = await this.prisma.scheduledReport.update({
      where: { id },
      data: {
        deletedAt: data.deletedAt,
        deletedByUserId: data.deletedByUserId,
        updatedAt: data.updatedAt,
        updatedByUserId: data.updatedByUserId,
        isActive: false,
      },
    });

    return mapScheduledReport(updated);
  }

  async findDueActive(asOf: Date, take = 50): Promise<readonly ScheduledReportRecord[]> {
    const rows = await this.prisma.scheduledReport.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        nextRunAt: { lte: asOf },
      },
      orderBy: { nextRunAt: 'asc' },
      take,
    });

    return rows.map(mapScheduledReport);
  }
}

function mapScheduledReport(row: ScheduledReport): ScheduledReportRecord {
  return {
    id: row.id,
    tenantId: row.tenantId,
    workspaceId: row.workspaceId,
    name: row.name,
    reportType: row.reportType,
    frequency: row.frequency,
    exportFormat: row.exportFormat,
    recipientEmails: row.recipientEmails,
    filters: parseFilters(row.filters),
    isActive: row.isActive,
    nextRunAt: row.nextRunAt,
    lastRunAt: row.lastRunAt,
    lastStatus: row.lastStatus,
    lastError: row.lastError,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdByUserId: row.createdByUserId,
    updatedByUserId: row.updatedByUserId,
    deletedAt: row.deletedAt,
    deletedByUserId: row.deletedByUserId,
  };
}

function parseFilters(value: Prisma.JsonValue): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    result[key] = entry;
  }
  return result;
}
