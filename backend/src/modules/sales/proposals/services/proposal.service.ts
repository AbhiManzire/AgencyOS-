import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { ActivityService } from '../../../activities/services/activity.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { ProposalDomainService } from '../domain/proposal-domain.service';
import { PROPOSAL_DOMAIN_ERROR_CODES, ProposalDomainError } from '../domain/proposal-domain.errors';
import { createDefaultProposalSections, mergeProposalSections } from '../domain/proposal-sections';
import {
  PROPOSAL_REPOSITORY,
  PROPOSAL_VERSION_REPOSITORY,
  type CreateProposalData,
  type ProposalRepository,
  type ProposalScope,
  type ProposalVersionRepository,
  type UpdateProposalData,
} from '../repositories/proposal.repository.interface';
import type {
  CreateProposalCommand,
  ListProposalsQuery,
  ListProposalsResult,
  ProposalApplicationContext,
  ProposalRecord,
  UpdateProposalCommand,
} from './proposal-application.types';

@Injectable()
export class ProposalService {
  constructor(
    @Inject(PROPOSAL_REPOSITORY)
    private readonly proposalRepository: ProposalRepository,
    @Inject(PROPOSAL_VERSION_REPOSITORY)
    private readonly proposalVersionRepository: ProposalVersionRepository,
    private readonly proposalDomainService: ProposalDomainService,
    private readonly activityService: ActivityService,
    private readonly prisma: PrismaService,
  ) {}

  async getProposal(scope: ProposalScope, proposalId: string): Promise<ProposalRecord> {
    return this.requireProposal(scope, proposalId);
  }

  async createProposal(
    scope: ProposalScope,
    command: CreateProposalCommand,
    context: ProposalApplicationContext,
  ): Promise<ProposalRecord> {
    await this.proposalDomainService.validateDeal(scope, command.dealId);

    if (command.quoteId !== undefined && command.quoteId !== null) {
      await this.proposalDomainService.validateQuote(scope, command.quoteId, command.dealId);
    }

    const sections = this.proposalDomainService.normalizeSections(
      command.sections ?? createDefaultProposalSections(),
    );

    this.proposalDomainService.validateCreate({
      title: command.title,
      status: command.status,
      sections,
    });

    const now = new Date();
    const title = this.proposalDomainService.normalizeTitle(command.title);

    const data: CreateProposalData = {
      id: randomUUID(),
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      dealId: command.dealId,
      quoteId: command.quoteId ?? null,
      title,
      version: 1,
      status: command.status ?? 'DRAFT',
      sections,
      amount: command.amount ?? null,
      tax: command.tax ?? null,
      discount: command.discount ?? null,
      validUntil: command.validUntil ?? null,
      createdAt: now,
      updatedAt: now,
      createdByUserId: context.actorUserId,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(async () => {
      const proposal = await this.proposalRepository.create(data);

      await this.proposalVersionRepository.create({
        id: randomUUID(),
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        proposalId: proposal.id,
        version: proposal.version,
        title: proposal.title,
        status: proposal.status,
        sections: proposal.sections,
        createdAt: now,
        createdByUserId: context.actorUserId,
      });

      await this.logActivity(scope, context, {
        entityType: 'deal',
        entityId: proposal.dealId,
        type: 'proposal.created',
        title: 'Proposal created',
        description: `${proposal.title} (v${String(proposal.version)})`,
        metadata: { proposalId: proposal.id, version: proposal.version },
      });

      return proposal;
    });
  }

  async updateProposal(
    scope: ProposalScope,
    proposalId: string,
    command: UpdateProposalCommand,
    context: ProposalApplicationContext,
  ): Promise<ProposalRecord> {
    const existing = await this.requireProposal(scope, proposalId);

    if (command.quoteId !== undefined && command.quoteId !== null) {
      await this.proposalDomainService.validateQuote(scope, command.quoteId, existing.dealId);
    }

    const nextSections =
      command.sections !== undefined
        ? mergeProposalSections(existing.sections, command.sections)
        : existing.sections;

    this.proposalDomainService.validateUpdate(existing, {
      title: command.title,
      status: command.status,
      sections: nextSections,
    });

    const now = new Date();
    const shouldIncrementVersion = command.incrementVersion === true;
    const nextVersion = shouldIncrementVersion ? existing.version + 1 : existing.version;
    const statusChangedToSent =
      command.status !== undefined && command.status === 'SENT' && existing.status !== 'SENT';

    const data: UpdateProposalData = {
      ...(command.quoteId !== undefined ? { quoteId: command.quoteId } : {}),
      ...(command.title !== undefined
        ? { title: this.proposalDomainService.normalizeTitle(command.title) }
        : {}),
      ...(command.status !== undefined ? { status: command.status } : {}),
      ...(command.sections !== undefined ? { sections: nextSections } : {}),
      ...(command.amount !== undefined ? { amount: command.amount } : {}),
      ...(command.tax !== undefined ? { tax: command.tax } : {}),
      ...(command.discount !== undefined ? { discount: command.discount } : {}),
      ...(command.validUntil !== undefined ? { validUntil: command.validUntil } : {}),
      ...(shouldIncrementVersion ? { version: nextVersion } : {}),
      updatedAt: now,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(async () => {
      if (shouldIncrementVersion) {
        await this.proposalVersionRepository.create({
          id: randomUUID(),
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          proposalId: existing.id,
          version: nextVersion,
          title:
            command.title !== undefined
              ? this.proposalDomainService.normalizeTitle(command.title)
              : existing.title,
          status: command.status ?? existing.status,
          sections: nextSections,
          createdAt: now,
          createdByUserId: context.actorUserId,
        });
      }

      const updated = await this.proposalRepository.update(scope, proposalId, data);

      if (updated === null) {
        throw new ProposalDomainError(
          PROPOSAL_DOMAIN_ERROR_CODES.PROPOSAL_NOT_FOUND,
          'Proposal was not found.',
        );
      }

      await this.logActivity(scope, context, {
        entityType: 'deal',
        entityId: updated.dealId,
        type: shouldIncrementVersion ? 'proposal.versioned' : 'proposal.updated',
        title: shouldIncrementVersion ? 'Proposal version saved' : 'Proposal updated',
        description: `${updated.title} (v${String(updated.version)})`,
        metadata: { proposalId: updated.id, version: updated.version },
      });

      if (statusChangedToSent) {
        await this.logActivity(scope, context, {
          entityType: 'deal',
          entityId: updated.dealId,
          type: 'proposal.sent',
          title: 'Proposal sent',
          description: `${updated.title} (v${String(updated.version)}) was sent.`,
          metadata: { proposalId: updated.id, version: updated.version },
        });
      }

      return updated;
    });
  }

  async listProposals(
    scope: ProposalScope,
    query: ListProposalsQuery = {},
  ): Promise<ListProposalsResult> {
    return this.proposalRepository.list({
      scope,
      skip: query.skip,
      take: query.take,
      dealId: query.dealId,
      status: query.status,
    });
  }

  private async requireProposal(scope: ProposalScope, proposalId: string): Promise<ProposalRecord> {
    const proposal = await this.proposalRepository.findById(scope, proposalId);

    if (proposal === null) {
      throw new ProposalDomainError(
        PROPOSAL_DOMAIN_ERROR_CODES.PROPOSAL_NOT_FOUND,
        'Proposal was not found.',
      );
    }

    return proposal;
  }

  private async logActivity(
    scope: ProposalScope,
    context: ProposalApplicationContext,
    command: {
      readonly entityType: string;
      readonly entityId: string;
      readonly type: string;
      readonly title: string;
      readonly description: string;
      readonly metadata: Prisma.InputJsonValue;
    },
  ): Promise<void> {
    await this.activityService.createActivity(scope, command, context);
  }

  private async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async () => work());
  }
}
