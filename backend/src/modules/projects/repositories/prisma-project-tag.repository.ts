import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  EnsureTagData,
  ProjectTagRecord,
  ProjectTagRepository,
  ProjectTagScope,
} from './project-tag.repository.interface';

@Injectable()
export class PrismaProjectTagRepository implements ProjectTagRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listByProject(scope: ProjectTagScope): Promise<readonly ProjectTagRecord[]> {
    const rows = await this.prisma.projectTag.findMany({
      where: {
        tenantId: scope.tenantId,
        projectId: scope.projectId,
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
    scope: Pick<ProjectTagScope, 'tenantId' | 'workspaceId'>,
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
    scope: Pick<ProjectTagScope, 'tenantId' | 'workspaceId'>,
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

  async isAssigned(scope: ProjectTagScope, tagId: string): Promise<boolean> {
    const existing = await this.prisma.projectTag.findUnique({
      where: {
        tenantId_projectId_tagId: {
          tenantId: scope.tenantId,
          projectId: scope.projectId,
          tagId,
        },
      },
    });

    return existing !== null;
  }

  async assign(scope: ProjectTagScope, tagId: string, assignedAt: Date): Promise<ProjectTagRecord> {
    const row = await this.prisma.projectTag.create({
      data: {
        tenantId: scope.tenantId,
        projectId: scope.projectId,
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

  async unassign(scope: ProjectTagScope, tagId: string): Promise<boolean> {
    const result = await this.prisma.projectTag.deleteMany({
      where: {
        tenantId: scope.tenantId,
        projectId: scope.projectId,
        tagId,
      },
    });

    return result.count > 0;
  }
}
