import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DEAL_DOMAIN_ERROR_CODES, DealDomainError } from '../../deals/domain/deal-domain.errors';
import {
  DEAL_REPOSITORY,
  type DealRepository,
  type DealScope,
} from '../../deals/repositories/deal.repository.interface';
import { FollowUpDomainService } from '../domain/followup-domain.service';
import { FOLLOWUP_DOMAIN_ERROR_CODES, FollowUpDomainError } from '../domain/followup-domain.errors';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  FOLLOWUP_REPOSITORY,
  type CreateFollowUpData,
  type FollowUpDealScope,
  type FollowUpRepository,
  type FollowUpScope,
  type UpdateFollowUpData,
} from '../repositories/followup.repository.interface';
import type {
  CreateFollowUpCommand,
  FollowUpApplicationContext,
  FollowUpRecord,
  UpdateFollowUpCommand,
} from './followup-application.types';

@Injectable()
export class FollowUpService {
  constructor(
    @Inject(FOLLOWUP_REPOSITORY)
    private readonly followUpRepository: FollowUpRepository,
    @Inject(DEAL_REPOSITORY)
    private readonly dealRepository: DealRepository,
    private readonly followUpDomainService: FollowUpDomainService,
    private readonly prisma: PrismaService,
  ) {}

  async listFollowUps(scope: DealScope, dealId: string): Promise<readonly FollowUpRecord[]> {
    await this.requireDealForRead(scope, dealId);

    return this.followUpRepository.listByDeal(this.toDealScope(scope, dealId));
  }

  async createFollowUp(
    scope: DealScope,
    dealId: string,
    command: CreateFollowUpCommand,
    context: FollowUpApplicationContext,
  ): Promise<FollowUpRecord> {
    await this.requireDealForMutation(scope, dealId);

    this.followUpDomainService.validateCreate({
      subject: command.subject,
      type: command.type,
      scheduledAt: command.scheduledAt,
      status: command.status,
    });

    const now = new Date();

    const data: CreateFollowUpData = {
      id: randomUUID(),
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      dealId,
      subject: this.followUpDomainService.normalizeSubject(command.subject),
      type: command.type,
      scheduledAt: command.scheduledAt,
      notes: this.followUpDomainService.normalizeOptionalNotes(command.notes),
      reminderAt: command.reminderAt ?? null,
      outcome: this.followUpDomainService.normalizeOptionalNotes(command.outcome),
      nextFollowUpAt: command.nextFollowUpAt ?? null,
      ownerUserId: command.ownerUserId ?? null,
      status: command.status ?? 'PENDING',
      createdAt: now,
      updatedAt: now,
      createdByUserId: context.actorUserId,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(() => this.followUpRepository.create(data));
  }

  async updateFollowUp(
    scope: FollowUpScope,
    followUpId: string,
    command: UpdateFollowUpCommand,
    context: FollowUpApplicationContext,
  ): Promise<FollowUpRecord> {
    const existing = await this.requireFollowUp(scope, followUpId);

    this.followUpDomainService.validateUpdate(existing, {
      subject: command.subject,
      type: command.type,
      scheduledAt: command.scheduledAt,
      status: command.status,
    });

    const now = new Date();

    const data: UpdateFollowUpData = {
      ...(command.subject !== undefined
        ? { subject: this.followUpDomainService.normalizeSubject(command.subject) }
        : {}),
      ...(command.type !== undefined ? { type: command.type } : {}),
      ...(command.scheduledAt !== undefined ? { scheduledAt: command.scheduledAt } : {}),
      ...(command.notes !== undefined
        ? { notes: this.followUpDomainService.normalizeOptionalNotes(command.notes) }
        : {}),
      ...(command.reminderAt !== undefined ? { reminderAt: command.reminderAt } : {}),
      ...(command.outcome !== undefined
        ? { outcome: this.followUpDomainService.normalizeOptionalNotes(command.outcome) }
        : {}),
      ...(command.nextFollowUpAt !== undefined ? { nextFollowUpAt: command.nextFollowUpAt } : {}),
      ...(command.ownerUserId !== undefined ? { ownerUserId: command.ownerUserId } : {}),
      ...(command.status !== undefined ? { status: command.status } : {}),
      updatedAt: now,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(async () => {
      const updated = await this.followUpRepository.update(scope, followUpId, data);

      if (updated === null) {
        throw new FollowUpDomainError(
          FOLLOWUP_DOMAIN_ERROR_CODES.FOLLOWUP_NOT_FOUND,
          'Follow-up was not found.',
        );
      }

      return updated;
    });
  }

  async deleteFollowUp(
    scope: FollowUpScope,
    followUpId: string,
    context: FollowUpApplicationContext,
  ): Promise<FollowUpRecord> {
    await this.requireFollowUp(scope, followUpId);
    const now = new Date();

    return this.runInTransaction(async () => {
      const deleted = await this.followUpRepository.softDelete(scope, followUpId, {
        deletedAt: now,
        deletedByUserId: context.actorUserId,
        updatedAt: now,
        updatedByUserId: context.actorUserId,
      });

      if (deleted === null) {
        throw new FollowUpDomainError(
          FOLLOWUP_DOMAIN_ERROR_CODES.FOLLOWUP_NOT_FOUND,
          'Follow-up was not found.',
        );
      }

      return deleted;
    });
  }

  private async requireDealForRead(scope: DealScope, dealId: string): Promise<void> {
    const deal = await this.dealRepository.findById(scope, dealId);

    if (deal === null) {
      throw new DealDomainError(DEAL_DOMAIN_ERROR_CODES.DEAL_NOT_FOUND, 'Deal was not found.');
    }
  }

  private async requireDealForMutation(scope: DealScope, dealId: string): Promise<void> {
    const deal = await this.dealRepository.findById(scope, dealId);

    if (deal === null) {
      throw new DealDomainError(DEAL_DOMAIN_ERROR_CODES.DEAL_NOT_FOUND, 'Deal was not found.');
    }

    if (deal.deletedAt !== null) {
      throw new DealDomainError(
        DEAL_DOMAIN_ERROR_CODES.DEAL_ARCHIVED,
        'Deal is archived and cannot be modified.',
      );
    }
  }

  private async requireFollowUp(scope: FollowUpScope, followUpId: string): Promise<FollowUpRecord> {
    const followUp = await this.followUpRepository.findById(scope, followUpId);

    if (followUp === null) {
      throw new FollowUpDomainError(
        FOLLOWUP_DOMAIN_ERROR_CODES.FOLLOWUP_NOT_FOUND,
        'Follow-up was not found.',
      );
    }

    return followUp;
  }

  private toDealScope(scope: DealScope, dealId: string): FollowUpDealScope {
    return {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      dealId,
    };
  }

  private async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async () => work());
  }
}
