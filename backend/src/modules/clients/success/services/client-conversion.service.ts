import { Injectable } from '@nestjs/common';
import { ActivityType, type ClientSource } from '@prisma/client';
import { ActivityService } from '../../../activities/services/activity.service';
import { PrismaService } from '../../../prisma/prisma.service';
import type { ClientApplicationContext } from '../../services/client-application.types';
import type { ClientRecord, ClientScope } from '../../repositories/client.repository.interface';
import { CLIENT_SUCCESS_ERROR_CODES, ClientSuccessError } from '../domain/client-success.errors';
import { ClientHealthService } from './client-health.service';
import { ClientMetricsService, type ClientMetrics } from './client-metrics.service';

export interface ConvertFromWonDealResult {
  readonly client: ClientRecord;
  readonly dealId: string;
  readonly metrics: ClientMetrics;
}

@Injectable()
export class ClientConversionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: ActivityService,
    private readonly clientHealthService: ClientHealthService,
    private readonly clientMetricsService: ClientMetricsService,
  ) {}

  async convertFromWonDeal(
    scope: ClientScope,
    dealId: string,
    context: ClientApplicationContext,
  ): Promise<ConvertFromWonDealResult> {
    const deal = await this.prisma.deal.findFirst({
      where: {
        id: dealId,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
      },
      select: {
        id: true,
        clientId: true,
        stage: true,
        status: true,
      },
    });

    if (deal === null) {
      throw new ClientSuccessError(
        CLIENT_SUCCESS_ERROR_CODES.DEAL_NOT_FOUND,
        'Deal was not found.',
      );
    }

    if (deal.stage !== 'WON' && deal.status !== 'WON') {
      throw new ClientSuccessError(
        CLIENT_SUCCESS_ERROR_CODES.DEAL_NOT_WON,
        'Deal must be won before activating the client.',
      );
    }

    const client = await this.activateClientFromWonDeal(scope, deal.id, deal.clientId, context);
    const metrics = await this.clientMetricsService.getMetrics(scope, client.id);

    return {
      client,
      dealId: deal.id,
      metrics,
    };
  }

  /**
   * Idempotent activation used by DealService.winDeal and convert-from-deal.
   */
  async activateClientFromWonDeal(
    scope: ClientScope,
    dealId: string,
    clientId: string,
    context: ClientApplicationContext,
  ): Promise<ClientRecord> {
    const existing = await this.prisma.client.findFirst({
      where: {
        id: clientId,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
      },
    });

    if (existing === null) {
      throw new ClientSuccessError(
        CLIENT_SUCCESS_ERROR_CODES.CLIENT_NOT_FOUND,
        'Client was not found.',
      );
    }

    if (existing.mergedIntoClientId !== null) {
      throw new ClientSuccessError(
        CLIENT_SUCCESS_ERROR_CODES.CLIENT_ALREADY_MERGED,
        'Client was already merged into another account.',
      );
    }

    const now = new Date();
    const today = startOfUtcDay(now);
    const actorUserId = normalizeActorUserId(context.actorUserId);

    const nextSource = resolveWonDealSource(existing.source);
    const becameClientAt = existing.becameClientAt ?? today;
    const originDealId = existing.originDealId ?? dealId;

    await this.prisma.client.update({
      where: { id: existing.id },
      data: {
        status: 'ACTIVE',
        becameClientAt,
        originDealId,
        source: nextSource,
        mergedIntoClientId: null,
        deletedAt: null,
        deletedByUserId: null,
        updatedAt: now,
        updatedByUserId: actorUserId,
      },
    });

    await this.activityService.logSystemEvent(
      scope,
      {
        entityType: 'client',
        entityId: existing.id,
        type: ActivityType.CLIENT_CONVERTED,
        title: 'Client activated from won deal',
        description: `Client activated from deal ${dealId}.`,
        metadata: { dealId, originDealId },
        dedupeKey: `client-converted:${existing.id}:${dealId}`,
      },
      { actorUserId: actorUserId ?? '' },
    );

    await this.clientHealthService.refreshAndPersist(scope, existing.id);

    const updated = await this.prisma.client.findFirstOrThrow({
      where: { id: existing.id },
    });

    return toClientRecord(updated);
  }
}

function resolveWonDealSource(current: ClientSource | null): ClientSource {
  if (current === null || current === 'SALES_CONVERSION') {
    return 'WON_DEAL';
  }
  return current;
}

function normalizeActorUserId(actorUserId: string | undefined): string | null {
  if (actorUserId === undefined || actorUserId.trim().length === 0) {
    return null;
  }
  return actorUserId;
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
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
