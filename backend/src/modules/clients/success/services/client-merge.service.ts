import { Injectable } from '@nestjs/common';
import { ActivityType, type Prisma } from '@prisma/client';
import { ActivityService } from '../../../activities/services/activity.service';
import { PrismaService } from '../../../prisma/prisma.service';
import type { ClientApplicationContext } from '../../services/client-application.types';
import type { ClientRecord, ClientScope } from '../../repositories/client.repository.interface';
import { CLIENT_SUCCESS_ERROR_CODES, ClientSuccessError } from '../domain/client-success.errors';
import { ClientHealthService } from './client-health.service';

export interface MergeClientsCommand {
  readonly sourceClientId: string;
  readonly targetClientId: string;
}

export interface MergeClientsMovedCounts {
  readonly deals: number;
  readonly projects: number;
  readonly invoices: number;
  readonly quotes: number;
  readonly contacts: number;
  readonly tags: number;
  readonly renewals: number;
  readonly salesTasks: number;
  readonly comments: number;
  readonly files: number;
  readonly activities: number;
  readonly followUps: number;
  readonly leads: number;
  readonly creditNotes: number;
  readonly ledgerEntries: number;
}

export interface MergeClientsResult {
  readonly client: ClientRecord;
  readonly moved: MergeClientsMovedCounts;
}

@Injectable()
export class ClientMergeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: ActivityService,
    private readonly clientHealthService: ClientHealthService,
  ) {}

  async mergeClients(
    scope: ClientScope,
    command: MergeClientsCommand,
    context: ClientApplicationContext,
  ): Promise<MergeClientsResult> {
    if (command.sourceClientId === command.targetClientId) {
      throw new ClientSuccessError(
        CLIENT_SUCCESS_ERROR_CODES.MERGE_SAME_CLIENT,
        'Cannot merge a client into itself.',
      );
    }

    const [source, target] = await Promise.all([
      this.prisma.client.findFirst({
        where: {
          id: command.sourceClientId,
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
        },
      }),
      this.prisma.client.findFirst({
        where: {
          id: command.targetClientId,
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
        },
      }),
    ]);

    if (source === null || target === null) {
      throw new ClientSuccessError(
        CLIENT_SUCCESS_ERROR_CODES.CLIENT_NOT_FOUND,
        'Client was not found.',
      );
    }

    if (source.deletedAt !== null || source.status === 'ARCHIVED') {
      throw new ClientSuccessError(
        CLIENT_SUCCESS_ERROR_CODES.MERGE_SOURCE_ARCHIVED,
        'Source client is archived and cannot be merged.',
      );
    }

    if (target.deletedAt !== null || target.status === 'ARCHIVED') {
      throw new ClientSuccessError(
        CLIENT_SUCCESS_ERROR_CODES.MERGE_TARGET_ARCHIVED,
        'Target client is archived and cannot receive a merge.',
      );
    }

    if (source.mergedIntoClientId !== null) {
      throw new ClientSuccessError(
        CLIENT_SUCCESS_ERROR_CODES.CLIENT_ALREADY_MERGED,
        'Source client was already merged into another account.',
      );
    }

    const now = new Date();
    const actorUserId = normalizeActorUserId(context.actorUserId);
    const sourceId = source.id;
    const targetId = target.id;

    const moved = await this.prisma.$transaction(async (tx) => {
      const counts = await this.reassignOwnedRecords(tx, scope, sourceId, targetId);

      const renamedDisplayName = truncate(`merged-${sourceId}-${source.displayName}`, 255);
      const renamedSlug = truncate(`merged-${sourceId}-${source.slug}`, 120);
      const renamedClientCode =
        source.clientCode !== null
          ? truncate(`M-${sourceId.slice(0, 8)}-${source.clientCode}`, 50)
          : null;

      await tx.client.update({
        where: { id: sourceId },
        data: {
          displayName: renamedDisplayName,
          slug: renamedSlug,
          clientCode: renamedClientCode,
          status: 'ARCHIVED',
          deletedAt: now,
          deletedByUserId: actorUserId,
          mergedIntoClientId: targetId,
          updatedAt: now,
          updatedByUserId: actorUserId,
        },
      });

      return counts;
    });

    await this.activityService.logSystemEvent(
      scope,
      {
        entityType: 'client',
        entityId: targetId,
        type: ActivityType.CLIENT_MERGED,
        title: 'Clients merged',
        description: `Merged client ${source.displayName} into this account.`,
        metadata: {
          sourceClientId: sourceId,
          targetClientId: targetId,
          moved: { ...moved },
        },
      },
      { actorUserId: actorUserId ?? '' },
    );

    await this.clientHealthService.refreshAndPersist(scope, targetId);

    const updatedTarget = await this.prisma.client.findFirstOrThrow({
      where: { id: targetId },
    });

    return {
      client: toClientRecord(updatedTarget),
      moved,
    };
  }

  private async reassignOwnedRecords(
    tx: Prisma.TransactionClient,
    scope: ClientScope,
    sourceId: string,
    targetId: string,
  ): Promise<MergeClientsMovedCounts> {
    const scopeWhere = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      clientId: sourceId,
    };

    const deals = await tx.deal.updateMany({
      where: scopeWhere,
      data: { clientId: targetId },
    });
    const projects = await tx.project.updateMany({
      where: scopeWhere,
      data: { clientId: targetId },
    });
    const invoices = await tx.invoice.updateMany({
      where: scopeWhere,
      data: { clientId: targetId },
    });
    const quotes = await tx.quote.updateMany({
      where: scopeWhere,
      data: { clientId: targetId },
    });
    const contacts = await tx.clientContact.updateMany({
      where: scopeWhere,
      data: { clientId: targetId },
    });
    const renewals = await tx.clientRenewal.updateMany({
      where: scopeWhere,
      data: { clientId: targetId },
    });
    const salesTasks = await tx.salesTask.updateMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        clientId: sourceId,
      },
      data: { clientId: targetId },
    });
    const creditNotes = await tx.creditNote.updateMany({
      where: scopeWhere,
      data: { clientId: targetId },
    });
    const ledgerEntries = await tx.ledgerEntry.updateMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        clientId: sourceId,
      },
      data: { clientId: targetId },
    });
    const leads = await tx.lead.updateMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        convertedClientId: sourceId,
      },
      data: { convertedClientId: targetId },
    });

    const comments = await tx.comment.updateMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        entityType: 'client',
        entityId: sourceId,
      },
      data: { entityId: targetId },
    });
    const files = await tx.file.updateMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        entityType: 'client',
        entityId: sourceId,
      },
      data: { entityId: targetId },
    });
    const activities = await tx.activity.updateMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        entityType: 'client',
        entityId: sourceId,
      },
      data: { entityId: targetId },
    });
    const followUps = await tx.followUp.updateMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        entityType: 'client',
        entityId: sourceId,
      },
      data: { entityId: targetId },
    });

    const tagsMoved = await this.reassignClientTags(tx, scope, sourceId, targetId);

    return {
      deals: deals.count,
      projects: projects.count,
      invoices: invoices.count,
      quotes: quotes.count,
      contacts: contacts.count,
      tags: tagsMoved,
      renewals: renewals.count,
      salesTasks: salesTasks.count,
      comments: comments.count,
      files: files.count,
      activities: activities.count,
      followUps: followUps.count,
      leads: leads.count,
      creditNotes: creditNotes.count,
      ledgerEntries: ledgerEntries.count,
    };
  }

  private async reassignClientTags(
    tx: Prisma.TransactionClient,
    scope: ClientScope,
    sourceId: string,
    targetId: string,
  ): Promise<number> {
    const sourceTags = await tx.clientTag.findMany({
      where: {
        tenantId: scope.tenantId,
        clientId: sourceId,
      },
    });

    if (sourceTags.length === 0) {
      return 0;
    }

    const targetTags = await tx.clientTag.findMany({
      where: {
        tenantId: scope.tenantId,
        clientId: targetId,
      },
      select: { tagId: true },
    });
    const targetTagIds = new Set(targetTags.map((tag) => tag.tagId));

    let moved = 0;
    for (const tag of sourceTags) {
      await tx.clientTag.delete({
        where: {
          tenantId_clientId_tagId: {
            tenantId: scope.tenantId,
            clientId: sourceId,
            tagId: tag.tagId,
          },
        },
      });

      if (targetTagIds.has(tag.tagId)) {
        continue;
      }

      await tx.clientTag.create({
        data: {
          tenantId: scope.tenantId,
          clientId: targetId,
          tagId: tag.tagId,
          createdAt: tag.createdAt,
        },
      });
      moved += 1;
    }

    return moved;
  }
}

function normalizeActorUserId(actorUserId: string | undefined): string | null {
  if (actorUserId === undefined || actorUserId.trim().length === 0) {
    return null;
  }
  return actorUserId;
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : value.slice(0, max);
}

function toClientRecord(client: {
  id: string;
  tenantId: string;
  workspaceId: string;
  displayName: string;
  slug: string;
  status: ClientRecord['status'];
  legalName: string | null;
  clientCode: string | null;
  industry: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  gstin: string | null;
  pan: string | null;
  currency: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  stateRegion: string | null;
  postalCode: string | null;
  countryCode: string | null;
  shippingAddressLine1: string | null;
  shippingAddressLine2: string | null;
  shippingCity: string | null;
  shippingStateRegion: string | null;
  shippingPostalCode: string | null;
  shippingCountryCode: string | null;
  ownerUserId: string | null;
  source: ClientRecord['source'];
  externalReferenceId: string | null;
  becameClientAt: Date | null;
  originDealId: string | null;
  mergedIntoClientId: string | null;
  healthStatus: ClientRecord['healthStatus'];
  healthScore: number | null;
  healthCalculatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdByUserId: string | null;
  updatedByUserId: string | null;
  deletedAt: Date | null;
  deletedByUserId: string | null;
}): ClientRecord {
  return {
    id: client.id,
    tenantId: client.tenantId,
    workspaceId: client.workspaceId,
    displayName: client.displayName,
    slug: client.slug,
    status: client.status,
    legalName: client.legalName,
    clientCode: client.clientCode,
    industry: client.industry,
    website: client.website,
    phone: client.phone,
    email: client.email,
    gstin: client.gstin,
    pan: client.pan,
    currency: client.currency,
    addressLine1: client.addressLine1,
    addressLine2: client.addressLine2,
    city: client.city,
    stateRegion: client.stateRegion,
    postalCode: client.postalCode,
    countryCode: client.countryCode,
    shippingAddressLine1: client.shippingAddressLine1,
    shippingAddressLine2: client.shippingAddressLine2,
    shippingCity: client.shippingCity,
    shippingStateRegion: client.shippingStateRegion,
    shippingPostalCode: client.shippingPostalCode,
    shippingCountryCode: client.shippingCountryCode,
    ownerUserId: client.ownerUserId,
    source: client.source,
    externalReferenceId: client.externalReferenceId,
    becameClientAt: client.becameClientAt,
    originDealId: client.originDealId,
    mergedIntoClientId: client.mergedIntoClientId,
    healthStatus: client.healthStatus,
    healthScore: client.healthScore,
    healthCalculatedAt: client.healthCalculatedAt,
    createdAt: client.createdAt,
    updatedAt: client.updatedAt,
    createdByUserId: client.createdByUserId,
    updatedByUserId: client.updatedByUserId,
    deletedAt: client.deletedAt,
    deletedByUserId: client.deletedByUserId,
  };
}
