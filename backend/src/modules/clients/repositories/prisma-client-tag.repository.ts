import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  ClientTagRecord,
  ClientTagRepository,
  ClientTagScope,
  EnsureTagData,
} from './client-tag.repository.interface';

@Injectable()
export class PrismaClientTagRepository implements ClientTagRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listByClient(scope: ClientTagScope): Promise<readonly ClientTagRecord[]> {
    const rows = await this.prisma.clientTag.findMany({
      where: {
        tenantId: scope.tenantId,
        clientId: scope.clientId,
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
    scope: Pick<ClientTagScope, 'tenantId' | 'workspaceId'>,
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
    scope: Pick<ClientTagScope, 'tenantId' | 'workspaceId'>,
    data: EnsureTagData,
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

  async isAssigned(scope: ClientTagScope, tagId: string): Promise<boolean> {
    const existing = await this.prisma.clientTag.findUnique({
      where: {
        tenantId_clientId_tagId: {
          tenantId: scope.tenantId,
          clientId: scope.clientId,
          tagId,
        },
      },
    });

    return existing !== null;
  }

  async assign(scope: ClientTagScope, tagId: string, assignedAt: Date): Promise<ClientTagRecord> {
    const row = await this.prisma.clientTag.create({
      data: {
        tenantId: scope.tenantId,
        clientId: scope.clientId,
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

  async unassign(scope: ClientTagScope, tagId: string): Promise<boolean> {
    const result = await this.prisma.clientTag.deleteMany({
      where: {
        tenantId: scope.tenantId,
        clientId: scope.clientId,
        tagId,
      },
    });

    return result.count > 0;
  }
}
