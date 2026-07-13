import { BadRequestException, Injectable } from '@nestjs/common';
import { ActivityType } from '@prisma/client';
import { ActivityService } from '../../../activities/services/activity.service';
import { DealService } from '../../deals/services/deal.service';
import { LeadService } from '../../leads/services/lead.service';
import { SalesTaskService } from '../tasks/services/sales-task.service';
import type {
  QuickActionCommand,
  QuickActionResult,
  WorkspaceApplicationContext,
  WorkspaceScope,
} from './workspace-application.types';

@Injectable()
export class WorkspaceQuickActionsService {
  constructor(
    private readonly salesTaskService: SalesTaskService,
    private readonly activityService: ActivityService,
    private readonly leadService: LeadService,
    private readonly dealService: DealService,
  ) {}

  async execute(
    scope: WorkspaceScope,
    command: QuickActionCommand,
    context: WorkspaceApplicationContext,
  ): Promise<QuickActionResult> {
    switch (command.action) {
      case 'complete_task':
        return this.completeTask(scope, command, context);
      case 'reschedule_task':
        return this.rescheduleTask(scope, command, context);
      case 'reassign_task':
        return this.reassignTask(scope, command, context);
      case 'add_note':
        return this.logActivity(scope, command, context, ActivityType.NOTE, 'Note');
      case 'log_call':
        return this.logActivity(scope, command, context, ActivityType.CALL, 'Call');
      case 'start_meeting':
        return this.startMeeting(scope, command, context);
      case 'send_email':
        return this.logActivity(scope, command, context, ActivityType.EMAIL, 'Email');
      case 'send_whatsapp':
        return this.logActivity(scope, command, context, ActivityType.WHATSAPP, 'WhatsApp');
      case 'convert_lead':
        return this.convertLead(scope, command, context);
      case 'open_deal':
        return this.openDeal(scope, command);
      default:
        throw new BadRequestException(`Unsupported quick action: ${String(command.action)}`);
    }
  }

  private async completeTask(
    scope: WorkspaceScope,
    command: QuickActionCommand,
    context: WorkspaceApplicationContext,
  ): Promise<QuickActionResult> {
    const taskId = requireId(command.taskId, 'taskId');
    const result = await this.salesTaskService.completeSalesTask(scope, taskId, context);
    return { ok: true, result };
  }

  private async rescheduleTask(
    scope: WorkspaceScope,
    command: QuickActionCommand,
    context: WorkspaceApplicationContext,
  ): Promise<QuickActionResult> {
    const taskId = requireId(command.taskId, 'taskId');
    const dueDate = requireId(command.dueDate, 'dueDate');
    const result = await this.salesTaskService.rescheduleSalesTask(
      scope,
      taskId,
      { dueDate, dueTime: command.dueTime },
      context,
    );
    return { ok: true, result };
  }

  private async reassignTask(
    scope: WorkspaceScope,
    command: QuickActionCommand,
    context: WorkspaceApplicationContext,
  ): Promise<QuickActionResult> {
    const taskId = requireId(command.taskId, 'taskId');
    const ownerUserId = requireId(command.ownerUserId, 'ownerUserId');
    const result = await this.salesTaskService.reassignSalesTask(
      scope,
      taskId,
      { ownerUserId },
      context,
    );
    return { ok: true, result };
  }

  private async logActivity(
    scope: WorkspaceScope,
    command: QuickActionCommand,
    context: WorkspaceApplicationContext,
    type: ActivityType,
    defaultTitle: string,
  ): Promise<QuickActionResult> {
    const entity = resolveEntity(command);
    const activityTitle = nonEmptyTrimmed(command.title) ?? defaultTitle;
    const activity = await this.activityService.logManualActivity(
      scope,
      {
        entityType: entity.entityType,
        entityId: entity.entityId,
        type,
        title: activityTitle,
        description: command.note ?? command.description,
      },
      context,
    );
    return { ok: true, result: activity };
  }

  private async startMeeting(
    scope: WorkspaceScope,
    command: QuickActionCommand,
    context: WorkspaceApplicationContext,
  ): Promise<QuickActionResult> {
    const entity = resolveEntity(command);
    const meetingTitle = nonEmptyTrimmed(command.title) ?? 'Meeting';
    const activity = await this.activityService.logManualActivity(
      scope,
      {
        entityType: entity.entityType,
        entityId: entity.entityId,
        type: ActivityType.MEETING,
        title: meetingTitle,
        description: command.note ?? command.description,
      },
      context,
    );

    const dueDate = command.dueDate ?? formatDateOnlyUtc(new Date());
    const task = await this.salesTaskService.createSalesTask(
      scope,
      {
        type: 'MEETING',
        title: meetingTitle,
        description: command.note ?? command.description ?? null,
        ownerUserId: command.ownerUserId ?? context.actorUserId,
        dueDate,
        dueTime: command.dueTime ?? null,
        leadId: command.leadId ?? null,
        dealId: command.dealId ?? null,
        clientId: command.clientId ?? null,
        metadata: { activityId: activity.id, quickAction: 'start_meeting' },
      },
      context,
    );

    return { ok: true, result: { activity, task } };
  }

  private async convertLead(
    scope: WorkspaceScope,
    command: QuickActionCommand,
    context: WorkspaceApplicationContext,
  ): Promise<QuickActionResult> {
    const leadId = requireId(command.leadId, 'leadId');
    const result = await this.leadService.convertLead(scope, leadId, context);
    return { ok: true, result };
  }

  private async openDeal(
    scope: WorkspaceScope,
    command: QuickActionCommand,
  ): Promise<QuickActionResult> {
    const dealId = requireId(command.dealId, 'dealId');
    const deal = await this.dealService.getDeal(scope, dealId);
    return { ok: true, result: { dealId: deal.id, deal } };
  }
}

function requireId(value: string | undefined, field: string): string {
  if (value === undefined || value.trim().length === 0) {
    throw new BadRequestException(`${field} is required.`);
  }
  return value.trim();
}

function resolveEntity(command: QuickActionCommand): {
  entityType: string;
  entityId: string;
} {
  if (command.leadId) {
    return { entityType: 'lead', entityId: command.leadId };
  }
  if (command.dealId) {
    return { entityType: 'deal', entityId: command.dealId };
  }
  if (command.clientId) {
    return { entityType: 'client', entityId: command.clientId };
  }
  throw new BadRequestException('leadId, dealId, or clientId is required.');
}

function formatDateOnlyUtc(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${String(year)}-${month}-${day}`;
}

function nonEmptyTrimmed(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed !== undefined && trimmed.length > 0 ? trimmed : undefined;
}
