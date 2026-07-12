import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import {
  ScheduledReportExportFormat,
  ScheduledReportFrequency,
  ScheduledReportRunStatus,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { EMAIL_SERVICE, type EmailService } from '../../notifications/email.service.interface';
import type { CreateScheduledReportDto } from '../dto/create-scheduled-report.dto';
import type { ListScheduledReportsQueryDto } from '../dto/list-scheduled-reports-query.dto';
import type { ReportQueryDto } from '../dto/report-date-range-query.dto';
import type { UpdateScheduledReportDto } from '../dto/update-scheduled-report.dto';
import type { ExportFormat, ReportsScope, ScheduledReportRecord } from '../reports.types';
import {
  SCHEDULED_REPORT_REPOSITORY,
  type ScheduledReportRepository,
} from '../repositories/scheduled-report.repository.interface';
import { ReportsService } from './reports.service';

const PROCESS_INTERVAL_MS = 15 * 60 * 1000;

export interface ScheduledReportApplicationContext {
  readonly actorUserId: string | null;
}

@Injectable()
export class ScheduledReportService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ScheduledReportService.name);
  private processInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    @Inject(SCHEDULED_REPORT_REPOSITORY)
    private readonly scheduledReportRepository: ScheduledReportRepository,
    private readonly reportsService: ReportsService,
    @Inject(EMAIL_SERVICE)
    private readonly emailService: EmailService,
  ) {}

  onModuleInit(): void {
    this.processInterval = setInterval(() => {
      void this.processDue().catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`Scheduled report processDue failed: ${message}`);
      });
    }, PROCESS_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    if (this.processInterval !== null) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }
  }

  async create(
    scope: ReportsScope,
    dto: CreateScheduledReportDto,
    context: ScheduledReportApplicationContext,
  ): Promise<ScheduledReportRecord> {
    const reportType = this.reportsService.normalizeReportType(dto.reportType);
    const now = new Date();
    const frequency = dto.frequency;
    const exportFormat = dto.exportFormat ?? ScheduledReportExportFormat.CSV;

    return this.scheduledReportRepository.create({
      id: randomUUID(),
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      name: dto.name.trim(),
      reportType,
      frequency,
      exportFormat,
      recipientEmails: dto.recipientEmails.map((email) => email.trim().toLowerCase()),
      filters: dto.filters ?? {},
      isActive: dto.isActive ?? true,
      nextRunAt: computeNextRunAt(frequency, now),
      createdAt: now,
      updatedAt: now,
      createdByUserId: context.actorUserId,
      updatedByUserId: context.actorUserId,
    });
  }

  async list(
    scope: ReportsScope,
    query: ListScheduledReportsQueryDto,
  ): Promise<{ items: readonly ScheduledReportRecord[]; total: number }> {
    return this.scheduledReportRepository.list({
      scope,
      skip: query.skip,
      take: query.take,
      isActive: query.isActive,
    });
  }

  async getById(scope: ReportsScope, id: string): Promise<ScheduledReportRecord> {
    const record = await this.scheduledReportRepository.findById(scope, id);
    if (record === null) {
      throw new NotFoundException(`Scheduled report "${id}" was not found.`);
    }
    return record;
  }

  async update(
    scope: ReportsScope,
    id: string,
    dto: UpdateScheduledReportDto,
    context: ScheduledReportApplicationContext,
  ): Promise<ScheduledReportRecord> {
    const existing = await this.getById(scope, id);
    const normalizedReportType =
      dto.reportType !== undefined
        ? this.reportsService.normalizeReportType(dto.reportType)
        : undefined;

    const now = new Date();
    const frequency = dto.frequency ?? existing.frequency;

    const updated = await this.scheduledReportRepository.update(scope, id, {
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(normalizedReportType !== undefined ? { reportType: normalizedReportType } : {}),
      ...(dto.frequency !== undefined ? { frequency } : {}),
      ...(dto.exportFormat !== undefined ? { exportFormat: dto.exportFormat } : {}),
      ...(dto.recipientEmails !== undefined
        ? {
            recipientEmails: dto.recipientEmails.map((email) => email.trim().toLowerCase()),
          }
        : {}),
      ...(dto.filters !== undefined ? { filters: dto.filters } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      ...(dto.frequency !== undefined ? { nextRunAt: computeNextRunAt(frequency, now) } : {}),
      updatedAt: now,
      updatedByUserId: context.actorUserId,
    });

    if (updated === null) {
      throw new NotFoundException(`Scheduled report "${id}" was not found.`);
    }
    return updated;
  }

  async softDelete(
    scope: ReportsScope,
    id: string,
    context: ScheduledReportApplicationContext,
  ): Promise<ScheduledReportRecord> {
    await this.getById(scope, id);
    const now = new Date();
    const deleted = await this.scheduledReportRepository.softDelete(scope, id, {
      deletedAt: now,
      deletedByUserId: context.actorUserId,
      updatedAt: now,
      updatedByUserId: context.actorUserId,
    });
    if (deleted === null) {
      throw new NotFoundException(`Scheduled report "${id}" was not found.`);
    }
    return deleted;
  }

  async runNow(
    scope: ReportsScope,
    id: string,
    context: ScheduledReportApplicationContext,
  ): Promise<ScheduledReportRecord> {
    const schedule = await this.getById(scope, id);
    return this.executeSchedule(schedule, context.actorUserId);
  }

  async processDue(): Promise<{ processed: number; succeeded: number; failed: number }> {
    const due = await this.scheduledReportRepository.findDueActive(new Date());
    let succeeded = 0;
    let failed = 0;

    for (const schedule of due) {
      try {
        await this.executeSchedule(schedule, null);
        succeeded += 1;
      } catch (error: unknown) {
        failed += 1;
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`Failed scheduled report ${schedule.id}: ${message}`);
      }
    }

    return { processed: due.length, succeeded, failed };
  }

  private async executeSchedule(
    schedule: ScheduledReportRecord,
    actorUserId: string | null,
  ): Promise<ScheduledReportRecord> {
    const scope: ReportsScope = {
      tenantId: schedule.tenantId,
      workspaceId: schedule.workspaceId,
    };
    const now = new Date();

    try {
      const reportType = this.reportsService.normalizeReportType(schedule.reportType);

      const query = filtersToQueryDto(schedule.filters, mapExportFormat(schedule.exportFormat));
      const exported = await this.reportsService.exportReport(scope, reportType, query);

      const subject = `Scheduled report: ${schedule.name}`;
      const html = `<p>Attached is your scheduled <strong>${schedule.reportType}</strong> report.</p><p>Generated at ${now.toISOString()}.</p>`;

      for (const recipient of schedule.recipientEmails) {
        await this.emailService.send({
          to: recipient,
          subject,
          html,
          attachments: [
            {
              filename: exported.filename,
              content: exported.buffer,
              mimeType: exported.contentType,
            },
          ],
        });
      }

      const updated = await this.scheduledReportRepository.update(scope, schedule.id, {
        lastRunAt: now,
        lastStatus: ScheduledReportRunStatus.SENT,
        lastError: null,
        nextRunAt: computeNextRunAt(schedule.frequency, now),
        updatedAt: now,
        updatedByUserId: actorUserId,
      });

      if (updated === null) {
        throw new NotFoundException(`Scheduled report "${schedule.id}" was not found.`);
      }
      return updated;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      await this.scheduledReportRepository.update(scope, schedule.id, {
        lastRunAt: now,
        lastStatus: ScheduledReportRunStatus.FAILED,
        lastError: message.slice(0, 2000),
        nextRunAt: computeNextRunAt(schedule.frequency, now),
        updatedAt: now,
        updatedByUserId: actorUserId,
      });
      throw error instanceof Error ? error : new BadRequestException(message);
    }
  }
}

export function computeNextRunAt(frequency: ScheduledReportFrequency, from: Date): Date {
  const next = new Date(from.getTime());
  switch (frequency) {
    case ScheduledReportFrequency.DAILY:
      next.setUTCDate(next.getUTCDate() + 1);
      break;
    case ScheduledReportFrequency.WEEKLY:
      next.setUTCDate(next.getUTCDate() + 7);
      break;
    case ScheduledReportFrequency.MONTHLY:
      next.setUTCMonth(next.getUTCMonth() + 1);
      break;
    default: {
      const exhaustive: never = frequency;
      throw new BadRequestException(`Unsupported frequency: ${String(exhaustive)}`);
    }
  }
  return next;
}

function mapExportFormat(format: ScheduledReportExportFormat): ExportFormat {
  switch (format) {
    case ScheduledReportExportFormat.CSV:
      return 'csv';
    case ScheduledReportExportFormat.PDF:
      return 'pdf';
    case ScheduledReportExportFormat.XLSX:
      return 'xlsx';
    default: {
      const exhaustive: never = format;
      throw new BadRequestException(`Unsupported export format: ${String(exhaustive)}`);
    }
  }
}

function filtersToQueryDto(filters: Record<string, unknown>, format: ExportFormat): ReportQueryDto {
  const dto: ReportQueryDto = { format };

  if (typeof filters.from === 'string') {
    dto.from = filters.from;
  }
  if (typeof filters.to === 'string') {
    dto.to = filters.to;
  }
  if (
    filters.period === 'month' ||
    filters.period === 'quarter' ||
    filters.period === 'year' ||
    filters.period === 'custom'
  ) {
    dto.period = filters.period;
  }
  if (typeof filters.clientId === 'string') {
    dto.clientId = filters.clientId;
  }
  if (typeof filters.projectId === 'string') {
    dto.projectId = filters.projectId;
  }
  if (typeof filters.departmentId === 'string') {
    dto.departmentId = filters.departmentId;
  }
  if (typeof filters.ownerUserId === 'string') {
    dto.ownerUserId = filters.ownerUserId;
  }
  if (typeof filters.currency === 'string') {
    dto.currency = filters.currency;
  }

  return dto;
}
