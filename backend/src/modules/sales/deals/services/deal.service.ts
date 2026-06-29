import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { ClientScope } from '../../../clients/repositories/client.repository.interface';
import { DealDomainService } from '../domain/deal-domain.service';
import { DEAL_DOMAIN_ERROR_CODES, DealDomainError } from '../domain/deal-domain.errors';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  DEAL_REPOSITORY,
  type CreateDealData,
  type DealRepository,
  type DealScope,
  type FindDealByIdOptions,
  type UpdateDealData,
} from '../repositories/deal.repository.interface';
import type {
  CreateDealCommand,
  DealApplicationContext,
  DealRecord,
  GetDealOptions,
  ListDealsQuery,
  ListDealsResult,
  UpdateDealCommand,
} from './deal-application.types';

@Injectable()
export class DealService {
  constructor(
    @Inject(DEAL_REPOSITORY)
    private readonly dealRepository: DealRepository,
    private readonly dealDomainService: DealDomainService,
    private readonly prisma: PrismaService,
  ) {}

  async createDeal(
    scope: DealScope,
    command: CreateDealCommand,
    context: DealApplicationContext,
  ): Promise<DealRecord> {
    const clientScope = toClientScope(scope);

    this.dealDomainService.validateCreate({
      title: command.title,
      value: command.value,
      stage: command.stage,
    });

    await this.dealDomainService.validateClient(clientScope, command.clientId);

    if (command.contactId !== undefined && command.contactId !== null) {
      await this.dealDomainService.validateContact(
        clientScope,
        command.clientId,
        command.contactId,
      );
    }

    const now = new Date();

    const data: CreateDealData = {
      id: randomUUID(),
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      clientId: command.clientId,
      contactId: command.contactId ?? null,
      title: this.dealDomainService.normalizeTitle(command.title),
      value: command.value,
      currency: command.currency ?? 'USD',
      expectedCloseDate: command.expectedCloseDate ?? null,
      ownerUserId: command.ownerUserId ?? null,
      stage: command.stage ?? 'NEW',
      createdAt: now,
      updatedAt: now,
      createdByUserId: context.actorUserId,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(() => this.dealRepository.create(data));
  }

  async updateDeal(
    scope: DealScope,
    dealId: string,
    command: UpdateDealCommand,
    context: DealApplicationContext,
  ): Promise<DealRecord> {
    const existing = await this.requireDeal(scope, dealId, { includeArchived: true });
    const clientScope = toClientScope(scope);
    const nextClientId = command.clientId ?? existing.clientId;

    this.dealDomainService.validateUpdate(existing, {
      title: command.title,
      value: command.value,
      stage: command.stage,
    });

    if (command.clientId !== undefined) {
      await this.dealDomainService.validateClient(clientScope, command.clientId);
    }

    if (command.contactId !== undefined && command.contactId !== null) {
      await this.dealDomainService.validateContact(clientScope, nextClientId, command.contactId);
    }

    const now = new Date();

    const data: UpdateDealData = {
      ...(command.clientId !== undefined ? { clientId: command.clientId } : {}),
      ...(command.contactId !== undefined ? { contactId: command.contactId } : {}),
      ...(command.title !== undefined
        ? { title: this.dealDomainService.normalizeTitle(command.title) }
        : {}),
      ...(command.value !== undefined ? { value: command.value } : {}),
      ...(command.currency !== undefined ? { currency: command.currency } : {}),
      ...(command.expectedCloseDate !== undefined
        ? { expectedCloseDate: command.expectedCloseDate }
        : {}),
      ...(command.ownerUserId !== undefined ? { ownerUserId: command.ownerUserId } : {}),
      ...(command.stage !== undefined ? { stage: command.stage } : {}),
      updatedAt: now,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(async () => {
      const updated = await this.dealRepository.update(scope, dealId, data);

      if (updated === null) {
        throw new DealDomainError(DEAL_DOMAIN_ERROR_CODES.DEAL_NOT_FOUND, 'Deal was not found.');
      }

      return updated;
    });
  }

  async getDeal(
    scope: DealScope,
    dealId: string,
    options: GetDealOptions = {},
  ): Promise<DealRecord> {
    const deal = await this.dealRepository.findById(scope, dealId, {
      includeArchived: options.includeArchived,
    });

    if (deal === null) {
      throw new DealDomainError(DEAL_DOMAIN_ERROR_CODES.DEAL_NOT_FOUND, 'Deal was not found.');
    }

    this.dealDomainService.ensureWorkspaceOwnership(scope, deal);
    return deal;
  }

  async listDeals(scope: DealScope, query: ListDealsQuery = {}): Promise<ListDealsResult> {
    return this.dealRepository.list({
      scope,
      skip: query.skip,
      take: query.take,
      stage: query.stage,
      ownerUserId: query.ownerUserId,
      clientId: query.clientId,
      includeArchived: query.includeArchived,
    });
  }

  private async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async () => work());
  }

  private async requireDeal(
    scope: DealScope,
    dealId: string,
    options?: FindDealByIdOptions,
  ): Promise<DealRecord> {
    const deal = await this.dealRepository.findById(scope, dealId, options);

    if (deal === null) {
      throw new DealDomainError(DEAL_DOMAIN_ERROR_CODES.DEAL_NOT_FOUND, 'Deal was not found.');
    }

    return deal;
  }
}

function toClientScope(scope: DealScope): ClientScope {
  return {
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
  };
}
