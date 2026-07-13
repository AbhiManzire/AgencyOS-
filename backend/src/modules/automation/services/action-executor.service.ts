import { Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import type { WorkflowAction } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { ActivityService } from '../../activities/services/activity.service';
import { NotificationService } from '../../notifications/services/notification.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { AutomationScope } from '../automation.types';

export interface ActionExecutionContext {
  readonly scope: AutomationScope;
  readonly executionId: string;
  readonly action: WorkflowAction;
  readonly payload: Record<string, unknown>;
  readonly actorUserId: string | null;
  readonly recordEntityType: string | null;
  readonly recordEntityId: string | null;
}

export interface ActionExecutionResult {
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

@Injectable()
export class ActionExecutorService {
  private readonly logger = new Logger(ActionExecutorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly moduleRef: ModuleRef,
  ) {}

  async execute(context: ActionExecutionContext): Promise<ActionExecutionResult> {
    const config = asRecord(context.action.config);
    const type = context.action.type;

    switch (type) {
      case 'ASSIGN_OWNER':
        return this.assignOwner(context, config);
      case 'CHANGE_STATUS':
      case 'UPDATE_STATUS':
        return this.changeStatus(context, config);
      case 'CREATE_TASK':
        return this.createTask(context, config);
      case 'CREATE_REMINDER':
        return this.createReminder(context, config);
      case 'CREATE_ACTIVITY':
        return this.createActivity(context, config);
      case 'CREATE_NOTIFICATION':
      case 'SEND_NOTIFICATION':
        return this.createNotification(context, config);
      case 'SEND_EMAIL':
        return {
          message: 'Email queued (provider not configured)',
          details: { to: config.to ?? null, subject: config.subject ?? null },
        };
      case 'SEND_WHATSAPP':
        return {
          message: 'WhatsApp message queued (provider not configured)',
          details: { to: config.to ?? null },
        };
      case 'CREATE_PROJECT':
        return this.createProject(context, config);
      case 'CREATE_INVOICE':
        return this.createInvoice(context, config);
      case 'ADD_TAGS':
        return this.addTags(context, config);
      case 'UPDATE_FIELD':
        return this.updateField(context, config);
      case 'CALL_WEBHOOK':
        return this.callWebhook(context, config);
      case 'RUN_INTERNAL_ACTION':
        return this.runInternalAction(config);
      default:
        return { message: `Unsupported action type ${String(type)} skipped` };
    }
  }

  private async assignOwner(
    context: ActionExecutionContext,
    config: Record<string, unknown>,
  ): Promise<ActionExecutionResult> {
    const ownerUserId = asString(config.ownerUserId ?? config.assigneeUserId ?? config.userId);
    const entityType = normalizeEntityType(
      asString(config.entityType) ??
        context.recordEntityType ??
        asString(context.payload.entityType),
    );
    const entityId =
      asString(config.entityId) ??
      context.recordEntityId ??
      asString(context.payload.entityId) ??
      asString(context.payload.id);

    if (ownerUserId === null || entityType === null || entityId === null) {
      throw new Error('ASSIGN_OWNER requires ownerUserId and entity reference.');
    }

    const now = new Date();
    switch (entityType) {
      case 'lead':
        await this.prisma.lead.updateMany({
          where: {
            id: entityId,
            tenantId: context.scope.tenantId,
            workspaceId: context.scope.workspaceId,
            deletedAt: null,
          },
          data: { assignedToUserId: ownerUserId, updatedAt: now },
        });
        break;
      case 'deal':
        await this.prisma.deal.updateMany({
          where: {
            id: entityId,
            tenantId: context.scope.tenantId,
            workspaceId: context.scope.workspaceId,
            deletedAt: null,
          },
          data: { ownerUserId, updatedAt: now },
        });
        break;
      case 'client':
        await this.prisma.client.updateMany({
          where: {
            id: entityId,
            tenantId: context.scope.tenantId,
            workspaceId: context.scope.workspaceId,
            deletedAt: null,
          },
          data: { ownerUserId, updatedAt: now },
        });
        break;
      case 'project':
        await this.prisma.project.updateMany({
          where: {
            id: entityId,
            tenantId: context.scope.tenantId,
            workspaceId: context.scope.workspaceId,
            deletedAt: null,
          },
          data: { projectManagerUserId: ownerUserId, updatedAt: now },
        });
        break;
      case 'task':
        await this.prisma.task.updateMany({
          where: {
            id: entityId,
            tenantId: context.scope.tenantId,
            workspaceId: context.scope.workspaceId,
            deletedAt: null,
          },
          data: { assigneeUserId: ownerUserId, updatedAt: now },
        });
        break;
      default:
        throw new Error(`ASSIGN_OWNER does not support entity type ${entityType}.`);
    }

    return { message: `Assigned owner on ${entityType}`, details: { entityId, ownerUserId } };
  }

  private async changeStatus(
    context: ActionExecutionContext,
    config: Record<string, unknown>,
  ): Promise<ActionExecutionResult> {
    const status = asString(config.status ?? config.value);
    const entityType = normalizeEntityType(
      asString(config.entityType) ??
        context.recordEntityType ??
        asString(context.payload.entityType),
    );
    const entityId =
      asString(config.entityId) ??
      context.recordEntityId ??
      asString(context.payload.entityId) ??
      asString(context.payload.id);

    if (status === null || entityType === null || entityId === null) {
      throw new Error('CHANGE_STATUS requires status and entity reference.');
    }

    const now = new Date();
    const where = {
      id: entityId,
      tenantId: context.scope.tenantId,
      workspaceId: context.scope.workspaceId,
      deletedAt: null,
    };

    switch (entityType) {
      case 'lead':
        await this.prisma.lead.updateMany({
          where,
          data: { status: status as never, updatedAt: now },
        });
        break;
      case 'deal':
        await this.prisma.deal.updateMany({
          where,
          data: { status: status as never, updatedAt: now },
        });
        break;
      case 'client':
        await this.prisma.client.updateMany({
          where,
          data: { status: status as never, updatedAt: now },
        });
        break;
      case 'project':
        await this.prisma.project.updateMany({
          where,
          data: { status: status as never, updatedAt: now },
        });
        break;
      case 'task':
        await this.prisma.task.updateMany({
          where,
          data: {
            status: status as never,
            updatedAt: now,
            ...(status === 'COMPLETED' ? { completedAt: now } : {}),
          },
        });
        break;
      case 'invoice':
        await this.prisma.invoice.updateMany({
          where,
          data: { status: status as never, updatedAt: now },
        });
        break;
      default:
        throw new Error(`CHANGE_STATUS does not support entity type ${entityType}.`);
    }

    return { message: `Updated status on ${entityType}`, details: { entityId, status } };
  }

  private async createTask(
    context: ActionExecutionContext,
    config: Record<string, unknown>,
  ): Promise<ActionExecutionResult> {
    const projectId = asString(config.projectId) ?? asString(context.payload.projectId);
    const title = asString(config.title) ?? 'Workflow task';

    if (projectId === null) {
      throw new Error('CREATE_TASK requires projectId.');
    }

    const now = new Date();
    const id = randomUUID();
    await this.prisma.task.create({
      data: {
        id,
        tenantId: context.scope.tenantId,
        workspaceId: context.scope.workspaceId,
        projectId,
        title,
        description: asString(config.description),
        status: (asString(config.status) ?? 'TODO') as never,
        priority: (asString(config.priority) ?? 'MEDIUM') as never,
        type: (asString(config.type) ?? 'FEATURE') as never,
        assigneeUserId: asString(config.assigneeUserId),
        createdAt: now,
        updatedAt: now,
        createdByUserId: context.actorUserId,
        updatedByUserId: context.actorUserId,
      },
    });

    return { message: 'Task created', details: { taskId: id, projectId } };
  }

  private async createReminder(
    context: ActionExecutionContext,
    config: Record<string, unknown>,
  ): Promise<ActionExecutionResult> {
    const assignedUserId =
      asString(config.assignedUserId) ?? asString(config.ownerUserId) ?? context.actorUserId;
    const title = asString(config.title) ?? 'Workflow reminder';

    if (assignedUserId === null) {
      throw new Error('CREATE_REMINDER requires assignedUserId.');
    }

    const now = new Date();
    const remindAt =
      parseDate(config.remindAt) ??
      new Date(now.getTime() + Math.max(0, asNumber(config.delayMinutes) ?? 60) * 60_000);
    const remindDate = new Date(
      Date.UTC(remindAt.getUTCFullYear(), remindAt.getUTCMonth(), remindAt.getUTCDate()),
    );
    const remindTime = `${String(remindAt.getUTCHours()).padStart(2, '0')}:${String(remindAt.getUTCMinutes()).padStart(2, '0')}`;
    const id = randomUUID();

    await this.prisma.reminder.create({
      data: {
        id,
        tenantId: context.scope.tenantId,
        workspaceId: context.scope.workspaceId,
        title,
        body: asString(config.body),
        remindDate,
        remindTime,
        remindAt,
        recurrence: (asString(config.recurrence) ?? 'NONE') as never,
        assignedUserId,
        notificationEventKey: asString(config.notificationEventKey) ?? 'REMINDER_DUE',
        entityType:
          asString(config.entityType) ??
          context.recordEntityType ??
          asString(context.payload.entityType),
        entityId:
          asString(config.entityId) ??
          context.recordEntityId ??
          asString(context.payload.entityId) ??
          asString(context.payload.id),
        status: 'PENDING',
        createdAt: now,
        updatedAt: now,
        createdByUserId: context.actorUserId,
        updatedByUserId: context.actorUserId,
      },
    });

    return { message: 'Reminder created', details: { reminderId: id } };
  }

  private async createActivity(
    context: ActionExecutionContext,
    config: Record<string, unknown>,
  ): Promise<ActionExecutionResult> {
    const entityType =
      asString(config.entityType) ??
      context.recordEntityType ??
      asString(context.payload.entityType) ??
      'workflow';
    const entityId =
      asString(config.entityId) ??
      context.recordEntityId ??
      asString(context.payload.entityId) ??
      asString(context.payload.id) ??
      context.executionId;
    const title = asString(config.title) ?? 'Workflow activity';

    try {
      const activityService = this.moduleRef.get(ActivityService, { strict: false });
      await activityService.logSystemEvent(
        context.scope,
        {
          entityType,
          entityId,
          type: (asString(config.type) ?? 'CUSTOM') as never,
          title,
          description: asString(config.description) ?? undefined,
          metadata: {
            workflowExecutionId: context.executionId,
            ...asRecord(config.metadata),
          },
        },
        { actorUserId: context.actorUserId ?? '' },
      );
      return { message: 'Activity logged via ActivityService', details: { entityType, entityId } };
    } catch (error) {
      this.logger.warn(
        `ActivityService unavailable, falling back to prisma.activity: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    const now = new Date();
    const id = randomUUID();
    await this.prisma.activity.create({
      data: {
        id,
        tenantId: context.scope.tenantId,
        workspaceId: context.scope.workspaceId,
        entityType,
        entityId,
        userId: context.actorUserId,
        type: (asString(config.type) ?? 'CUSTOM') as never,
        title,
        description: asString(config.description),
        origin: 'SYSTEM',
        createdAt: now,
      },
    });

    return { message: 'Activity created via Prisma', details: { activityId: id } };
  }

  private async createNotification(
    context: ActionExecutionContext,
    config: Record<string, unknown>,
  ): Promise<ActionExecutionResult> {
    const recipientUserId =
      asString(config.recipientUserId) ?? asString(config.userId) ?? context.actorUserId;
    const title = asString(config.title) ?? 'Workflow notification';
    const body = asString(config.body) ?? title;

    if (recipientUserId === null) {
      throw new Error('CREATE_NOTIFICATION requires recipientUserId.');
    }

    const notificationService = this.moduleRef.get(NotificationService, { strict: false });

    const notification = await notificationService.create(context.scope, {
      recipientUserId,
      category: (asString(config.category) ?? 'SYSTEM') as never,
      priority: (asString(config.priority) ?? 'NORMAL') as never,
      title,
      body,
      entityType:
        asString(config.entityType) ??
        context.recordEntityType ??
        asString(context.payload.entityType) ??
        undefined,
      entityId:
        asString(config.entityId) ??
        context.recordEntityId ??
        asString(context.payload.entityId) ??
        asString(context.payload.id) ??
        undefined,
      linkPath: asString(config.linkPath) ?? undefined,
      metadata: {
        workflowExecutionId: context.executionId,
        ...asRecord(config.metadata),
      },
    });

    return {
      message: 'Notification created',
      details: { notificationId: notification.id, recipientUserId },
    };
  }

  private async createProject(
    context: ActionExecutionContext,
    config: Record<string, unknown>,
  ): Promise<ActionExecutionResult> {
    const clientId = asString(config.clientId) ?? asString(context.payload.clientId);
    const name = asString(config.name) ?? asString(context.payload.name) ?? 'Workflow project';

    if (clientId === null) {
      throw new Error('CREATE_PROJECT requires clientId.');
    }

    const now = new Date();
    const id = randomUUID();
    await this.prisma.project.create({
      data: {
        id,
        tenantId: context.scope.tenantId,
        workspaceId: context.scope.workspaceId,
        clientId,
        name,
        description: asString(config.description),
        status: (asString(config.status) ?? 'PLANNING') as never,
        projectManagerUserId: asString(config.projectManagerUserId) ?? context.actorUserId,
        createdAt: now,
        updatedAt: now,
        createdByUserId: context.actorUserId,
        updatedByUserId: context.actorUserId,
      },
    });

    return { message: 'Project created', details: { projectId: id, clientId } };
  }

  private async createInvoice(
    context: ActionExecutionContext,
    config: Record<string, unknown>,
  ): Promise<ActionExecutionResult> {
    const clientId = asString(config.clientId) ?? asString(context.payload.clientId);
    const projectId = asString(config.projectId) ?? asString(context.payload.projectId);
    const invoiceNumber = asString(config.invoiceNumber);
    const currency = asString(config.currency) ?? asString(context.payload.currency) ?? 'USD';
    const issueDate = parseDate(config.issueDate) ?? new Date();
    const dueDate = parseDate(config.dueDate);

    if (clientId === null || projectId === null || invoiceNumber === null || dueDate === null) {
      this.logger.warn(
        'CREATE_INVOICE skipped — insufficient data (clientId, projectId, invoiceNumber, dueDate required)',
      );
      return {
        message: 'CREATE_INVOICE skipped — insufficient data',
        details: {
          clientId,
          projectId,
          invoiceNumber,
          dueDate: dueDate?.toISOString() ?? null,
        },
      };
    }

    const now = new Date();
    const id = randomUUID();
    await this.prisma.invoice.create({
      data: {
        id,
        tenantId: context.scope.tenantId,
        workspaceId: context.scope.workspaceId,
        clientId,
        projectId,
        invoiceNumber,
        currency,
        status: 'DRAFT',
        issueDate,
        dueDate,
        subtotal: asNumber(config.subtotal) ?? 0,
        taxAmount: asNumber(config.taxAmount) ?? asNumber(config.taxTotal) ?? 0,
        grandTotal: asNumber(config.grandTotal) ?? 0,
        balanceDue: asNumber(config.balanceDue) ?? asNumber(config.grandTotal) ?? 0,
        createdAt: now,
        updatedAt: now,
        createdByUserId: context.actorUserId,
        updatedByUserId: context.actorUserId,
      },
    });

    return { message: 'Invoice created', details: { invoiceId: id } };
  }

  private async addTags(
    context: ActionExecutionContext,
    config: Record<string, unknown>,
  ): Promise<ActionExecutionResult> {
    const entityType = normalizeEntityType(
      asString(config.entityType) ??
        context.recordEntityType ??
        asString(context.payload.entityType),
    );
    const entityId =
      asString(config.entityId) ??
      context.recordEntityId ??
      asString(context.payload.entityId) ??
      asString(context.payload.id);
    const tagIds = asStringArray(config.tagIds ?? config.tags);

    if (entityType === null || entityId === null || tagIds.length === 0) {
      throw new Error('ADD_TAGS requires entity reference and tagIds.');
    }

    const now = new Date();
    let assigned = 0;

    for (const tagId of tagIds) {
      switch (entityType) {
        case 'lead':
          await this.prisma.leadTag.upsert({
            where: {
              tenantId_leadId_tagId: {
                tenantId: context.scope.tenantId,
                leadId: entityId,
                tagId,
              },
            },
            create: {
              tenantId: context.scope.tenantId,
              leadId: entityId,
              tagId,
              createdAt: now,
            },
            update: {},
          });
          assigned += 1;
          break;
        case 'deal':
          await this.prisma.dealTag.upsert({
            where: {
              tenantId_dealId_tagId: {
                tenantId: context.scope.tenantId,
                dealId: entityId,
                tagId,
              },
            },
            create: {
              tenantId: context.scope.tenantId,
              dealId: entityId,
              tagId,
              createdAt: now,
            },
            update: {},
          });
          assigned += 1;
          break;
        case 'client':
          await this.prisma.clientTag.upsert({
            where: {
              tenantId_clientId_tagId: {
                tenantId: context.scope.tenantId,
                clientId: entityId,
                tagId,
              },
            },
            create: {
              tenantId: context.scope.tenantId,
              clientId: entityId,
              tagId,
              createdAt: now,
            },
            update: {},
          });
          assigned += 1;
          break;
        case 'project':
          await this.prisma.projectTag.upsert({
            where: {
              tenantId_projectId_tagId: {
                tenantId: context.scope.tenantId,
                projectId: entityId,
                tagId,
              },
            },
            create: {
              tenantId: context.scope.tenantId,
              projectId: entityId,
              tagId,
              createdAt: now,
            },
            update: {},
          });
          assigned += 1;
          break;
        case 'task':
          await this.prisma.taskTag.upsert({
            where: {
              tenantId_taskId_tagId: {
                tenantId: context.scope.tenantId,
                taskId: entityId,
                tagId,
              },
            },
            create: {
              tenantId: context.scope.tenantId,
              taskId: entityId,
              tagId,
              createdAt: now,
            },
            update: {},
          });
          assigned += 1;
          break;
        default:
          throw new Error(`ADD_TAGS does not support entity type ${entityType}.`);
      }
    }

    return {
      message: `Assigned ${String(assigned)} tag(s)`,
      details: { entityType, entityId, tagIds },
    };
  }

  private async updateField(
    context: ActionExecutionContext,
    config: Record<string, unknown>,
  ): Promise<ActionExecutionResult> {
    const field = asString(config.field);
    const entityType = normalizeEntityType(
      asString(config.entityType) ??
        context.recordEntityType ??
        asString(context.payload.entityType),
    );
    const entityId =
      asString(config.entityId) ??
      context.recordEntityId ??
      asString(context.payload.entityId) ??
      asString(context.payload.id);

    if (field === null || entityType === null || entityId === null) {
      throw new Error('UPDATE_FIELD requires field and entity reference.');
    }

    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field)) {
      throw new Error(`UPDATE_FIELD rejected unsafe field name: ${field}`);
    }

    const now = new Date();
    const data = { [field]: config.value, updatedAt: now } as Record<string, unknown>;
    const where = {
      id: entityId,
      tenantId: context.scope.tenantId,
      workspaceId: context.scope.workspaceId,
      deletedAt: null,
    };

    switch (entityType) {
      case 'lead':
        await this.prisma.lead.updateMany({ where, data: data as never });
        break;
      case 'deal':
        await this.prisma.deal.updateMany({ where, data: data as never });
        break;
      case 'client':
        await this.prisma.client.updateMany({ where, data: data as never });
        break;
      case 'project':
        await this.prisma.project.updateMany({ where, data: data as never });
        break;
      case 'task':
        await this.prisma.task.updateMany({ where, data: data as never });
        break;
      default:
        throw new Error(`UPDATE_FIELD does not support entity type ${entityType}.`);
    }

    return {
      message: `Updated field ${field} on ${entityType}`,
      details: { entityId, field, value: config.value },
    };
  }

  private async callWebhook(
    context: ActionExecutionContext,
    config: Record<string, unknown>,
  ): Promise<ActionExecutionResult> {
    const url = asString(config.url);
    if (url === null) {
      throw new Error('CALL_WEBHOOK requires config.url.');
    }

    const method = (asString(config.method) ?? 'POST').toUpperCase();
    const body = {
      executionId: context.executionId,
      payload: context.payload,
      config,
    };

    const response = await fetch(url, {
      method,
      headers: {
        'content-type': 'application/json',
        ...(asRecord(config.headers) as Record<string, string>),
      },
      body: method === 'GET' || method === 'HEAD' ? undefined : JSON.stringify(body),
    });

    const responseText = await response.text();
    this.logger.log(`Webhook ${url} responded with ${String(response.status)}`);

    if (!response.ok) {
      throw new Error(
        `Webhook call failed with status ${String(response.status)}: ${responseText.slice(0, 500)}`,
      );
    }

    return {
      message: 'Webhook called successfully',
      details: {
        url,
        status: response.status,
        bodyPreview: responseText.slice(0, 500),
      },
    };
  }

  private runInternalAction(config: Record<string, unknown>): ActionExecutionResult {
    const actionKey = asString(config.actionKey) ?? 'unknown';

    switch (actionKey) {
      case 'refresh_project_health':
        this.logger.log('Internal action refresh_project_health acknowledged (no-op)');
        return { message: 'Internal action refresh_project_health acknowledged' };
      default:
        this.logger.log(`Unknown internal actionKey=${actionKey}; no-op`);
        return { message: `Unknown internal action ${actionKey}; no-op` };
    }
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function asString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    const single = asString(value);
    return single === null ? [] : [single];
  }
  return value.map((item) => asString(item)).filter((item): item is string => item !== null);
}

function parseDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function normalizeEntityType(value: string | null): string | null {
  if (value === null) {
    return null;
  }
  return value.trim().toLowerCase();
}
