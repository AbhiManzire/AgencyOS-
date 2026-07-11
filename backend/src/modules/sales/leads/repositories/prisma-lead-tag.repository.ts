import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  EnsureLeadTagData,
  LeadTagRecord,
  LeadTagRepository,
  LeadTagScope,
} from './lead-tag.repository.interface';

@Injectable()
export class PrismaLeadTagRepository implements LeadTagRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listByLead(scope: LeadTagScope): Promise<readonly LeadTagRecord[]> {
    const rows = await this.prisma.leadTag.findMany({
      where: {
        tenantId: scope.tenantId,
        leadId: scope.leadId,
        tag: {
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          deletedAt: null,
        },
      },
      include: { tag: true },
      orderBy: { createdAt: 'asc' },
    });

    return rows.map((row) => ({
      id: row.tag.id,
      name: row.tag.name,
      colorToken: row.tag.colorToken,
      description: row.tag.description,
      assignedAt: row.createdAt,
    }));
  }

  async findTagByName(
    scope: Pick<LeadTagScope, 'tenantId' | 'workspaceId'>,
    name: string,
  ): Promise<{
    id: string;
    name: string;
    colorToken: string | null;
    description: string | null;
  } | null> {
    const tag = await this.prisma.tag.findFirst({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        name,
        deletedAt: null,
      },
    });

    if (tag === null) {
      return null;
    }

    return {
      id: tag.id,
      name: tag.name,
      colorToken: tag.colorToken,
      description: tag.description,
    };
  }

  async createTag(
    scope: Pick<LeadTagScope, 'tenantId' | 'workspaceId'>,
    data: EnsureLeadTagData,
  ): Promise<{ id: string; name: string; colorToken: string | null; description: string | null }> {
    const tag = await this.prisma.tag.create({
      data: {
        id: data.id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        name: data.name,
        colorToken: data.colorToken ?? null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        createdByUserId: data.createdByUserId ?? null,
        updatedByUserId: data.updatedByUserId ?? null,
      },
    });

    return {
      id: tag.id,
      name: tag.name,
      colorToken: tag.colorToken,
      description: tag.description,
    };
  }

  async isAssigned(scope: LeadTagScope, tagId: string): Promise<boolean> {
    const existing = await this.prisma.leadTag.findUnique({
      where: {
        tenantId_leadId_tagId: {
          tenantId: scope.tenantId,
          leadId: scope.leadId,
          tagId,
        },
      },
    });

    return existing !== null;
  }

  async assign(scope: LeadTagScope, tagId: string, assignedAt: Date): Promise<LeadTagRecord> {
    const row = await this.prisma.leadTag.create({
      data: {
        tenantId: scope.tenantId,
        leadId: scope.leadId,
        tagId,
        createdAt: assignedAt,
      },
      include: { tag: true },
    });

    return {
      id: row.tag.id,
      name: row.tag.name,
      colorToken: row.tag.colorToken,
      description: row.tag.description,
      assignedAt: row.createdAt,
    };
  }

  async unassign(scope: LeadTagScope, tagId: string): Promise<boolean> {
    const result = await this.prisma.leadTag.deleteMany({
      where: {
        tenantId: scope.tenantId,
        leadId: scope.leadId,
        tagId,
      },
    });

    return result.count > 0;
  }
}
