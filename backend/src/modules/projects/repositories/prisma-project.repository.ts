import { Injectable } from '@nestjs/common';
import type { Project } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateProjectData,
  FindByIdOptions,
  ListProjectsParams,
  ListProjectsResult,
  ProjectRecord,
  ProjectRepository,
  ProjectScope,
  UpdateProjectData,
} from './project.repository.interface';

@Injectable()
export class PrismaProjectRepository implements ProjectRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateProjectData): Promise<ProjectRecord> {
    const project = await this.prisma.project.create({ data });
    return toProjectRecord(project);
  }

  async update(
    scope: ProjectScope,
    id: string,
    data: UpdateProjectData,
  ): Promise<ProjectRecord | null> {
    const result = await this.prisma.project.updateMany({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
      },
      data,
    });

    if (result.count === 0) {
      return null;
    }

    return this.findById(scope, id);
  }

  async findById(
    scope: ProjectScope,
    id: string,
    options?: FindByIdOptions,
  ): Promise<ProjectRecord | null> {
    const project = await this.prisma.project.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        ...(options?.includeArchived ? {} : { deletedAt: null }),
      },
    });

    return project ? toProjectRecord(project) : null;
  }

  async findByCode(scope: ProjectScope, code: string): Promise<ProjectRecord | null> {
    const project = await this.prisma.project.findFirst({
      where: {
        code,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
      },
    });

    return project ? toProjectRecord(project) : null;
  }

  async list(params: ListProjectsParams): Promise<ListProjectsResult> {
    const { scope, skip = 0, take = 25, status, clientId, includeArchived = false } = params;

    const where = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      ...(includeArchived ? {} : { deletedAt: null }),
      ...(status !== undefined ? { status } : {}),
      ...(clientId !== undefined ? { clientId } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        skip,
        take,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      items: items.map(toProjectRecord),
      total,
    };
  }
}

function toProjectRecord(project: Project): ProjectRecord {
  return {
    id: project.id,
    tenantId: project.tenantId,
    workspaceId: project.workspaceId,
    clientId: project.clientId,
    name: project.name,
    code: project.code,
    description: project.description,
    status: project.status,
    projectManagerUserId: project.projectManagerUserId,
    priority: project.priority,
    startDate: project.startDate,
    targetEndDate: project.targetEndDate,
    completedAt: project.completedAt,
    invoiceReadyAt: project.invoiceReadyAt,
    isBillable: project.isBillable,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    createdByUserId: project.createdByUserId,
    updatedByUserId: project.updatedByUserId,
    deletedAt: project.deletedAt,
    deletedByUserId: project.deletedByUserId,
  };
}
