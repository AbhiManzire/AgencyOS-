import { Injectable } from '@nestjs/common';
import { Prisma, type Project } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  ArchiveProjectData,
  CreateProjectData,
  DepartmentOption,
  FindByIdOptions,
  ListProjectsParams,
  ListProjectsResult,
  ProjectListSortField,
  ProjectRecord,
  ProjectRepository,
  ProjectScope,
  ProjectTransactionClient,
  RestoreProjectData,
  UpdateProjectData,
} from './project.repository.interface';

@Injectable()
export class PrismaProjectRepository implements ProjectRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateProjectData, tx?: ProjectTransactionClient): Promise<ProjectRecord> {
    const db = tx ?? this.prisma;
    const project = await db.project.create({
      data: {
        id: data.id,
        tenantId: data.tenantId,
        workspaceId: data.workspaceId,
        clientId: data.clientId,
        name: data.name,
        code: data.code ?? null,
        description: data.description ?? null,
        status: data.status ?? 'PLANNING',
        projectManagerUserId: data.projectManagerUserId,
        departmentId: data.departmentId ?? null,
        priority: data.priority ?? 'NORMAL',
        startDate: data.startDate ?? null,
        targetEndDate: data.targetEndDate ?? null,
        budgetAmount:
          data.budgetAmount === undefined || data.budgetAmount === null
            ? null
            : new Prisma.Decimal(data.budgetAmount),
        estimatedHours:
          data.estimatedHours === undefined || data.estimatedHours === null
            ? null
            : new Prisma.Decimal(data.estimatedHours),
        actualHours:
          data.actualHours === undefined || data.actualHours === null
            ? null
            : new Prisma.Decimal(data.actualHours),
        isBillable: data.isBillable ?? true,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        createdByUserId: data.createdByUserId ?? null,
        updatedByUserId: data.updatedByUserId ?? null,
      },
    });
    return toProjectRecord(project);
  }

  async update(
    scope: ProjectScope,
    id: string,
    data: UpdateProjectData,
    tx?: ProjectTransactionClient,
  ): Promise<ProjectRecord | null> {
    const db = tx ?? this.prisma;
    const { budgetAmount, estimatedHours, actualHours, ...rest } = data;

    const result = await db.project.updateMany({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
      },
      data: {
        ...rest,
        ...(budgetAmount !== undefined
          ? {
              budgetAmount: budgetAmount === null ? null : new Prisma.Decimal(budgetAmount),
            }
          : {}),
        ...(estimatedHours !== undefined
          ? {
              estimatedHours: estimatedHours === null ? null : new Prisma.Decimal(estimatedHours),
            }
          : {}),
        ...(actualHours !== undefined
          ? {
              actualHours: actualHours === null ? null : new Prisma.Decimal(actualHours),
            }
          : {}),
      },
    });

    if (result.count === 0) {
      return null;
    }

    const project = await db.project.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
      },
    });

    return project ? toProjectRecord(project) : null;
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
    const {
      scope,
      skip = 0,
      take = 25,
      status,
      clientId,
      includeArchived = false,
      archivedOnly = false,
      q,
      projectManagerUserId,
      departmentId,
      priority,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
    } = params;

    const search = q?.trim();

    const where: Prisma.ProjectWhereInput = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      ...(archivedOnly ? { deletedAt: { not: null } } : includeArchived ? {} : { deletedAt: null }),
      ...(status !== undefined ? { status } : {}),
      ...(clientId !== undefined ? { clientId } : {}),
      ...(projectManagerUserId !== undefined ? { projectManagerUserId } : {}),
      ...(departmentId !== undefined ? { departmentId } : {}),
      ...(priority !== undefined ? { priority } : {}),
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

    const orderBy = buildOrderBy(sortBy, sortOrder);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        skip,
        take,
        orderBy,
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      items: items.map(toProjectRecord),
      total,
    };
  }

  async archive(
    scope: ProjectScope,
    id: string,
    data: ArchiveProjectData,
    tx?: ProjectTransactionClient,
  ): Promise<ProjectRecord | null> {
    const db = tx ?? this.prisma;
    const result = await db.project.updateMany({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
      },
      data: {
        status: data.status,
        deletedAt: data.deletedAt,
        deletedByUserId: data.deletedByUserId,
        updatedAt: data.updatedAt,
        updatedByUserId: data.updatedByUserId,
      },
    });

    if (result.count === 0) {
      return null;
    }

    const project = await db.project.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
      },
    });

    return project ? toProjectRecord(project) : null;
  }

  async restore(
    scope: ProjectScope,
    id: string,
    data: RestoreProjectData,
    tx?: ProjectTransactionClient,
  ): Promise<ProjectRecord | null> {
    const db = tx ?? this.prisma;
    const result = await db.project.updateMany({
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
        updatedByUserId: data.updatedByUserId,
      },
    });

    if (result.count === 0) {
      return null;
    }

    const project = await db.project.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
      },
    });

    return project ? toProjectRecord(project) : null;
  }

  async listDepartments(scope: ProjectScope): Promise<readonly DepartmentOption[]> {
    const departments = await this.prisma.department.findMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    });

    return departments;
  }
}

function buildOrderBy(
  sortBy: ProjectListSortField,
  sortOrder: 'asc' | 'desc',
): Prisma.ProjectOrderByWithRelationInput {
  switch (sortBy) {
    case 'name':
      return { name: sortOrder };
    case 'status':
      return { status: sortOrder };
    case 'priority':
      return { priority: sortOrder };
    case 'targetEndDate':
      return { targetEndDate: sortOrder };
    case 'createdAt':
      return { createdAt: sortOrder };
    case 'updatedAt':
    default:
      return { updatedAt: sortOrder };
  }
}

function toProjectRecord(project: Project): ProjectRecord {
  return {
    id: project.id,
    tenantId: project.tenantId,
    workspaceId: project.workspaceId,
    clientId: project.clientId,
    departmentId: project.departmentId,
    name: project.name,
    code: project.code,
    description: project.description,
    status: project.status,
    projectManagerUserId: project.projectManagerUserId,
    priority: project.priority,
    startDate: project.startDate,
    targetEndDate: project.targetEndDate,
    budgetAmount: project.budgetAmount?.toNumber() ?? null,
    estimatedHours: project.estimatedHours?.toNumber() ?? null,
    actualHours: project.actualHours?.toNumber() ?? null,
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
