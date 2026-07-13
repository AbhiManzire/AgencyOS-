import { Injectable } from '@nestjs/common';
import type { Prisma, SalesCampaign } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  ArchiveCampaignData,
  CampaignRecord,
  CampaignRepository,
  CampaignScope,
  CreateCampaignData,
  FindCampaignByIdOptions,
  ListCampaignsParams,
  ListCampaignsResult,
  RestoreCampaignData,
  UpdateCampaignData,
} from './campaign.repository.interface';

@Injectable()
export class PrismaCampaignRepository implements CampaignRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateCampaignData): Promise<CampaignRecord> {
    const campaign = await this.prisma.salesCampaign.create({
      data: {
        id: data.id,
        tenantId: data.tenantId,
        workspaceId: data.workspaceId,
        name: data.name,
        code: data.code ?? null,
        description: data.description ?? null,
        status: data.status ?? 'DRAFT',
        startsAt: data.startsAt ?? null,
        endsAt: data.endsAt ?? null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        createdByUserId: data.createdByUserId ?? null,
        updatedByUserId: data.updatedByUserId ?? null,
      },
    });

    return toCampaignRecord(campaign);
  }

  async update(
    scope: CampaignScope,
    id: string,
    data: UpdateCampaignData,
  ): Promise<CampaignRecord | null> {
    const result = await this.prisma.salesCampaign.updateMany({
      where: activeCampaignWhere(scope, id),
      data,
    });

    if (result.count === 0) {
      return null;
    }

    return this.findById(scope, id);
  }

  async archive(
    scope: CampaignScope,
    id: string,
    data: ArchiveCampaignData,
  ): Promise<CampaignRecord | null> {
    const result = await this.prisma.salesCampaign.updateMany({
      where: activeCampaignWhere(scope, id),
      data,
    });

    if (result.count === 0) {
      return null;
    }

    return this.findById(scope, id, { includeArchived: true });
  }

  async restore(
    scope: CampaignScope,
    id: string,
    data: RestoreCampaignData,
  ): Promise<CampaignRecord | null> {
    const result = await this.prisma.salesCampaign.updateMany({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        OR: [{ deletedAt: { not: null } }, { status: 'ARCHIVED' }],
      },
      data: {
        status: data.status,
        deletedAt: null,
        deletedByUserId: null,
        updatedAt: data.updatedAt,
        updatedByUserId: data.updatedByUserId ?? null,
      },
    });

    if (result.count === 0) {
      return null;
    }

    return this.findById(scope, id);
  }

  async findById(
    scope: CampaignScope,
    id: string,
    options?: FindCampaignByIdOptions,
  ): Promise<CampaignRecord | null> {
    const campaign = await this.prisma.salesCampaign.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        ...(options?.includeArchived ? {} : { deletedAt: null }),
      },
    });

    return campaign ? toCampaignRecord(campaign) : null;
  }

  async findByCode(scope: CampaignScope, code: string): Promise<CampaignRecord | null> {
    const campaign = await this.prisma.salesCampaign.findFirst({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        code,
        deletedAt: null,
      },
    });

    return campaign ? toCampaignRecord(campaign) : null;
  }

  async list(params: ListCampaignsParams): Promise<ListCampaignsResult> {
    const { scope, skip = 0, take = 25, q, status, includeArchived = false } = params;

    const search = q?.trim();

    const where: Prisma.SalesCampaignWhereInput = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      ...(includeArchived ? {} : { deletedAt: null }),
      ...(status !== undefined ? { status } : {}),
      ...(search && search.length > 0
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.salesCampaign.count({ where }),
      this.prisma.salesCampaign.findMany({
        where,
        skip,
        take,
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    return {
      items: items.map(toCampaignRecord),
      total,
    };
  }
}

function activeCampaignWhere(scope: CampaignScope, id: string) {
  return {
    id,
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    deletedAt: null,
  };
}

function toCampaignRecord(campaign: SalesCampaign): CampaignRecord {
  return {
    id: campaign.id,
    tenantId: campaign.tenantId,
    workspaceId: campaign.workspaceId,
    name: campaign.name,
    code: campaign.code,
    description: campaign.description,
    status: campaign.status,
    startsAt: campaign.startsAt,
    endsAt: campaign.endsAt,
    createdAt: campaign.createdAt,
    updatedAt: campaign.updatedAt,
    createdByUserId: campaign.createdByUserId,
    updatedByUserId: campaign.updatedByUserId,
    deletedAt: campaign.deletedAt,
    deletedByUserId: campaign.deletedByUserId,
  };
}
