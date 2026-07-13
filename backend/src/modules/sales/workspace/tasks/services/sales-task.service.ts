import { Inject, Injectable } from '@nestjs/common';
import { ActivityType, type Prisma, type SalesTaskType } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { ActivityService } from '../../../../activities/services/activity.service';
import { NOTIFICATION_EVENT_KEYS } from '../../../../notifications/events/notification-event.catalog';
import { SalesNotificationEmitter } from '../../../../notifications/events/sales-notification.emitter';
import { PrismaService } from '../../../../prisma/prisma.service';
import { formatDateOnlyUtc, SalesTaskDomainService } from '../domain/sales-task-domain.service';
import {
  SALES_TASK_DOMAIN_ERROR_CODES,
  SalesTaskDomainError,
} from '../domain/sales-task-domain.errors';
import {
  SALES_TASK_REPOSITORY,
  type CreateSalesTaskData,
  type SalesTaskRepository,
  type UpdateSalesTaskData,
} from '../repositories/sales-task.repository.interface';
import type {
  CreateSalesTaskCommand,
  ListSalesTasksQuery,
  ListSalesTasksResult,
  ReassignSalesTaskCommand,
  RescheduleSalesTaskCommand,
  SalesTaskApplicationContext,
  SalesTaskRecord,
  SalesTaskScope,
  UpdateSalesTaskCommand,
} from './sales-task-application.types';

@Injectable()
export class SalesTaskService {
  constructor(
    @Inject(SALES_TASK_REPOSITORY)
    private readonly salesTaskRepository: SalesTaskRepository,
    private readonly salesTaskDomainService: SalesTaskDomainService,
    private readonly activityService: ActivityService,
    private readonly salesNotificationEmitter: SalesNotificationEmitter,
    private readonly prisma: PrismaService,
  ) {}

  async createSalesTask(
    scope: SalesTaskScope,
    command: CreateSalesTaskCommand,
    context: SalesTaskApplicationContext,
  ): Promise<SalesTaskRecord> {
    this.salesTaskDomainService.validateCreate({
      title: command.title,
      type: command.type,
      ownerUserId: command.ownerUserId,
      dueDate: command.dueDate,
      dueTime: command.dueTime,
      priority: command.priority,
    });

    const now = new Date();
    const actorUserId = normalizeActorUserId(context.actorUserId);
    const dueTime = this.salesTaskDomainService.resolveDueTime(command.dueTime);
    const dueAt = this.salesTaskDomainService.computeDueAt(command.dueDate, dueTime);
    const dueDate = this.salesTaskDomainService.parseDueDate(command.dueDate);

    const data: CreateSalesTaskData = {
      id: randomUUID(),
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      type: command.type,
      title: this.salesTaskDomainService.normalizeRequiredString(command.title),
      description: this.salesTaskDomainService.normalizeOptionalString(command.description) ?? null,
      ownerUserId: command.ownerUserId,
      dueDate,
      dueTime,
      dueAt,
      priority: command.priority ?? 'MEDIUM',
      leadId: command.leadId ?? null,
      dealId: command.dealId ?? null,
      clientId: command.clientId ?? null,
      status: 'PENDING',
      metadata: toJsonValue(command.metadata),
      createdAt: now,
      updatedAt: now,
      createdByUserId: actorUserId,
      updatedByUserId: actorUserId,
    };

    const created = await this.runInTransaction(() => this.salesTaskRepository.create(data));

    if (actorUserId !== null && created.ownerUserId !== actorUserId) {
      await this.salesNotificationEmitter.emit(
        NOTIFICATION_EVENT_KEYS.NEW_ASSIGNMENT,
        scope,
        created.ownerUserId,
        {
          title: created.title,
          subject: created.title,
        },
        {
          entityType: 'sales_task',
          entityId: created.id,
          linkPath: `/sales/workspace/tasks/${created.id}`,
        },
      );
    }

    return created;
  }

  async listSalesTasks(
    scope: SalesTaskScope,
    query: ListSalesTasksQuery,
  ): Promise<ListSalesTasksResult> {
    return this.salesTaskRepository.list({
      scope,
      skip: query.skip ?? 0,
      take: query.take ?? 25,
      ownerUserId: query.ownerUserId,
      status: query.status,
      type: query.type,
      from: query.from ? startOfUtcDay(query.from) : undefined,
      to: query.to ? endOfUtcDay(query.to) : undefined,
      leadId: query.leadId,
      dealId: query.dealId,
      clientId: query.clientId,
    });
  }

  async getSalesTask(scope: SalesTaskScope, id: string): Promise<SalesTaskRecord> {
    return this.requireSalesTask(scope, id);
  }

  async updateSalesTask(
    scope: SalesTaskScope,
    id: string,
    command: UpdateSalesTaskCommand,
    context: SalesTaskApplicationContext,
  ): Promise<SalesTaskRecord> {
    const existing = await this.requireSalesTask(scope, id);

    this.salesTaskDomainService.validateUpdate(existing, {
      title: command.title,
      type: command.type,
      ownerUserId: command.ownerUserId,
      dueDate: command.dueDate,
      dueTime: command.dueTime,
      priority: command.priority,
      status: command.status,
    });

    const now = new Date();
    const actorUserId = normalizeActorUserId(context.actorUserId);
    const dueDateStr = command.dueDate ?? formatDateOnlyUtc(existing.dueDate);
    const dueTime =
      command.dueTime !== undefined
        ? this.salesTaskDomainService.resolveDueTime(command.dueTime)
        : this.salesTaskDomainService.resolveDueTime(existing.dueTime);
    const shouldRecomputeDueAt = command.dueDate !== undefined || command.dueTime !== undefined;

    const data: UpdateSalesTaskData = {
      ...(command.type !== undefined ? { type: command.type } : {}),
      ...(command.title !== undefined
        ? { title: this.salesTaskDomainService.normalizeRequiredString(command.title) }
        : {}),
      ...(command.description !== undefined
        ? {
            description:
              this.salesTaskDomainService.normalizeOptionalString(command.description) ?? null,
          }
        : {}),
      ...(command.ownerUserId !== undefined ? { ownerUserId: command.ownerUserId } : {}),
      ...(command.dueDate !== undefined
        ? { dueDate: this.salesTaskDomainService.parseDueDate(command.dueDate) }
        : {}),
      ...(command.dueTime !== undefined
        ? { dueTime: this.salesTaskDomainService.resolveDueTime(command.dueTime) }
        : {}),
      ...(shouldRecomputeDueAt
        ? { dueAt: this.salesTaskDomainService.computeDueAt(dueDateStr, dueTime) }
        : {}),
      ...(command.priority !== undefined ? { priority: command.priority } : {}),
      ...(command.leadId !== undefined ? { leadId: command.leadId } : {}),
      ...(command.dealId !== undefined ? { dealId: command.dealId } : {}),
      ...(command.clientId !== undefined ? { clientId: command.clientId } : {}),
      ...(command.status !== undefined ? { status: command.status } : {}),
      ...(command.metadata !== undefined ? { metadata: toJsonValue(command.metadata) } : {}),
      updatedAt: now,
      updatedByUserId: actorUserId,
    };

    const previousOwnerId = existing.ownerUserId;

    const updated = await this.runInTransaction(async () => {
      const result = await this.salesTaskRepository.update(scope, id, data);
      if (result === null) {
        throw new SalesTaskDomainError(
          SALES_TASK_DOMAIN_ERROR_CODES.SALES_TASK_NOT_FOUND,
          'Sales task was not found.',
        );
      }
      return result;
    });

    if (
      command.ownerUserId !== undefined &&
      command.ownerUserId !== previousOwnerId &&
      actorUserId !== null &&
      command.ownerUserId !== actorUserId
    ) {
      await this.salesNotificationEmitter.emit(
        NOTIFICATION_EVENT_KEYS.NEW_ASSIGNMENT,
        scope,
        updated.ownerUserId,
        {
          title: updated.title,
          subject: updated.title,
        },
        {
          entityType: 'sales_task',
          entityId: updated.id,
          linkPath: `/sales/workspace/tasks/${updated.id}`,
        },
      );
    }

    return updated;
  }

  async completeSalesTask(
    scope: SalesTaskScope,
    id: string,
    context: SalesTaskApplicationContext,
  ): Promise<SalesTaskRecord> {
    const existing = await this.requireSalesTask(scope, id);
    this.salesTaskDomainService.validateComplete(existing);

    const now = new Date();
    const actorUserId = normalizeActorUserId(context.actorUserId);
    const entityRef = resolveEntityRef(existing);

    let activityId: string | null = existing.activityId;

    if (entityRef !== null) {
      const activity = await this.activityService.logManualActivity(
        scope,
        {
          entityType: entityRef.entityType,
          entityId: entityRef.entityId,
          type: mapSalesTaskTypeToActivityType(existing.type),
          title: existing.title,
          description: existing.description ?? undefined,
          metadata: {
            salesTaskId: existing.id,
            salesTaskType: existing.type,
          },
          dedupeKey: `sales_task.completed:${existing.id}`,
        },
        { actorUserId: actorUserId ?? existing.ownerUserId },
      );
      activityId = activity.id;
    }

    return this.runInTransaction(async () => {
      const updated = await this.salesTaskRepository.update(scope, id, {
        status: 'COMPLETED',
        completedAt: now,
        activityId,
        updatedAt: now,
        updatedByUserId: actorUserId,
      });

      if (updated === null) {
        throw new SalesTaskDomainError(
          SALES_TASK_DOMAIN_ERROR_CODES.SALES_TASK_NOT_FOUND,
          'Sales task was not found.',
        );
      }

      return updated;
    });
  }

  async cancelSalesTask(
    scope: SalesTaskScope,
    id: string,
    context: SalesTaskApplicationContext,
  ): Promise<SalesTaskRecord> {
    const existing = await this.requireSalesTask(scope, id);
    this.salesTaskDomainService.validateCancel(existing);

    const now = new Date();
    const actorUserId = normalizeActorUserId(context.actorUserId);

    return this.runInTransaction(async () => {
      const updated = await this.salesTaskRepository.update(scope, id, {
        status: 'CANCELLED',
        cancelledAt: now,
        updatedAt: now,
        updatedByUserId: actorUserId,
      });

      if (updated === null) {
        throw new SalesTaskDomainError(
          SALES_TASK_DOMAIN_ERROR_CODES.SALES_TASK_NOT_FOUND,
          'Sales task was not found.',
        );
      }

      return updated;
    });
  }

  async rescheduleSalesTask(
    scope: SalesTaskScope,
    id: string,
    command: RescheduleSalesTaskCommand,
    context: SalesTaskApplicationContext,
  ): Promise<SalesTaskRecord> {
    const existing = await this.requireSalesTask(scope, id);
    this.salesTaskDomainService.validateReschedule(existing, command);

    const now = new Date();
    const actorUserId = normalizeActorUserId(context.actorUserId);
    const dueTime = this.salesTaskDomainService.resolveDueTime(
      command.dueTime !== undefined ? command.dueTime : existing.dueTime,
    );
    const dueAt = this.salesTaskDomainService.computeDueAt(command.dueDate, dueTime);
    const dueDate = this.salesTaskDomainService.parseDueDate(command.dueDate);
    const nextStatus = dueAt < now ? 'OVERDUE' : 'PENDING';

    return this.runInTransaction(async () => {
      const updated = await this.salesTaskRepository.update(scope, id, {
        dueDate,
        dueTime,
        dueAt,
        status: nextStatus,
        updatedAt: now,
        updatedByUserId: actorUserId,
      });

      if (updated === null) {
        throw new SalesTaskDomainError(
          SALES_TASK_DOMAIN_ERROR_CODES.SALES_TASK_NOT_FOUND,
          'Sales task was not found.',
        );
      }

      return updated;
    });
  }

  async reassignSalesTask(
    scope: SalesTaskScope,
    id: string,
    command: ReassignSalesTaskCommand,
    context: SalesTaskApplicationContext,
  ): Promise<SalesTaskRecord> {
    const existing = await this.requireSalesTask(scope, id);
    this.salesTaskDomainService.validateReassign(existing, command.ownerUserId);

    const now = new Date();
    const actorUserId = normalizeActorUserId(context.actorUserId);

    const updated = await this.runInTransaction(async () => {
      const result = await this.salesTaskRepository.update(scope, id, {
        ownerUserId: command.ownerUserId,
        updatedAt: now,
        updatedByUserId: actorUserId,
      });

      if (result === null) {
        throw new SalesTaskDomainError(
          SALES_TASK_DOMAIN_ERROR_CODES.SALES_TASK_NOT_FOUND,
          'Sales task was not found.',
        );
      }

      return result;
    });

    if (
      command.ownerUserId !== existing.ownerUserId &&
      (actorUserId === null || command.ownerUserId !== actorUserId)
    ) {
      await this.salesNotificationEmitter.emit(
        NOTIFICATION_EVENT_KEYS.NEW_ASSIGNMENT,
        scope,
        updated.ownerUserId,
        {
          title: updated.title,
          subject: updated.title,
        },
        {
          entityType: 'sales_task',
          entityId: updated.id,
          linkPath: `/sales/workspace/tasks/${updated.id}`,
        },
      );
    }

    return updated;
  }

  private async requireSalesTask(scope: SalesTaskScope, id: string): Promise<SalesTaskRecord> {
    const task = await this.salesTaskRepository.findById(scope, id);

    if (task === null) {
      throw new SalesTaskDomainError(
        SALES_TASK_DOMAIN_ERROR_CODES.SALES_TASK_NOT_FOUND,
        'Sales task was not found.',
      );
    }

    return task;
  }

  private async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async () => work());
  }
}

function normalizeActorUserId(actorUserId: string): string | null {
  const trimmed = actorUserId.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function startOfUtcDay(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

function endOfUtcDay(dateStr: string): Date {
  return new Date(`${dateStr}T23:59:59.999Z`);
}

function toJsonValue(
  metadata: Record<string, unknown> | null | undefined,
): Prisma.InputJsonValue | null | undefined {
  if (metadata === undefined) {
    return undefined;
  }
  if (metadata === null) {
    return null;
  }
  return metadata as Prisma.InputJsonValue;
}

function mapSalesTaskTypeToActivityType(type: SalesTaskType): ActivityType {
  switch (type) {
    case 'CALL':
      return ActivityType.CALL;
    case 'MEETING':
      return ActivityType.MEETING;
    case 'EMAIL':
      return ActivityType.EMAIL;
    case 'WHATSAPP':
      return ActivityType.WHATSAPP;
    default:
      return ActivityType.FOLLOW_UP;
  }
}

function resolveEntityRef(task: SalesTaskRecord): { entityType: string; entityId: string } | null {
  if (task.leadId !== null) {
    return { entityType: 'lead', entityId: task.leadId };
  }
  if (task.dealId !== null) {
    return { entityType: 'deal', entityId: task.dealId };
  }
  if (task.clientId !== null) {
    return { entityType: 'client', entityId: task.clientId };
  }
  return null;
}
