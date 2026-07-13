import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  CreateProjectTemplateData,
  NestedTemplateMilestoneInput,
  NestedTemplateTaskInput,
  ProjectTemplateRecord,
  ProjectTemplateRepository,
  ProjectTemplateScope,
  ProjectTemplateTransactionClient,
  UpdateProjectTemplateData,
} from './project-template.repository.interface';

const childrenInclude = {
  milestones: { orderBy: { sortOrder: 'asc' as const } },
  tasks: { orderBy: { sortOrder: 'asc' as const } },
  deliverables: { orderBy: { sortOrder: 'asc' as const } },
  requiredDocuments: { orderBy: { sortOrder: 'asc' as const } },
};

@Injectable()
export class PrismaProjectTemplateRepository implements ProjectTemplateRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: CreateProjectTemplateData,
    tx?: ProjectTemplateTransactionClient,
  ): Promise<ProjectTemplateRecord> {
    const db = tx ?? this.prisma;
    await db.projectTemplate.create({
      data: {
        id: data.id,
        tenantId: data.tenantId,
        workspaceId: data.workspaceId,
        name: data.name,
        description: data.description ?? null,
        serviceType: data.serviceType,
        defaultDurationDays: data.defaultDurationDays ?? null,
        defaultEstimatedHours:
          data.defaultEstimatedHours === undefined || data.defaultEstimatedHours === null
            ? null
            : new Prisma.Decimal(data.defaultEstimatedHours),
        isActive: data.isActive ?? true,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        createdByUserId: data.createdByUserId ?? null,
        updatedByUserId: data.updatedByUserId ?? null,
      },
    });

    await this.replaceChildren(
      db,
      {
        tenantId: data.tenantId,
        workspaceId: data.workspaceId,
        templateId: data.id,
      },
      data.milestones ?? [],
      data.tasks ?? [],
      data.deliverables ?? [],
      data.requiredDocuments ?? [],
    );

    const loaded = await this.findById(
      { tenantId: data.tenantId, workspaceId: data.workspaceId },
      data.id,
    );
    if (loaded === null) {
      throw new Error('Failed to load created project template.');
    }
    return loaded;
  }

  async update(
    scope: ProjectTemplateScope,
    id: string,
    data: UpdateProjectTemplateData,
    tx?: ProjectTemplateTransactionClient,
  ): Promise<ProjectTemplateRecord | null> {
    const db = tx ?? this.prisma;
    const {
      defaultEstimatedHours,
      milestones,
      tasks,
      deliverables,
      requiredDocuments,
      replaceChildren,
      ...rest
    } = data;

    const result = await db.projectTemplate.updateMany({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
      },
      data: {
        ...rest,
        ...(defaultEstimatedHours !== undefined
          ? {
              defaultEstimatedHours:
                defaultEstimatedHours === null ? null : new Prisma.Decimal(defaultEstimatedHours),
            }
          : {}),
      },
    });

    if (result.count === 0) {
      return null;
    }

    if (replaceChildren === true) {
      await this.replaceChildren(
        db,
        { tenantId: scope.tenantId, workspaceId: scope.workspaceId, templateId: id },
        milestones ?? [],
        tasks ?? [],
        deliverables ?? [],
        requiredDocuments ?? [],
      );
    }

    return this.findById(scope, id);
  }

  async softDelete(
    scope: ProjectTemplateScope,
    id: string,
    deletedAt: Date,
    deletedByUserId: string | null,
  ): Promise<ProjectTemplateRecord | null> {
    const result = await this.prisma.projectTemplate.updateMany({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
      },
      data: {
        deletedAt,
        deletedByUserId,
        updatedAt: deletedAt,
        updatedByUserId: deletedByUserId,
        isActive: false,
      },
    });

    if (result.count === 0) {
      return null;
    }

    return this.findById(scope, id, { includeDeleted: true });
  }

  async findById(
    scope: ProjectTemplateScope,
    id: string,
    options?: { includeDeleted?: boolean },
  ): Promise<ProjectTemplateRecord | null> {
    const template = await this.prisma.projectTemplate.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        ...(options?.includeDeleted ? {} : { deletedAt: null }),
      },
      include: childrenInclude,
    });

    return template ? toTemplateRecord(template) : null;
  }

  async findByName(
    scope: ProjectTemplateScope,
    name: string,
  ): Promise<ProjectTemplateRecord | null> {
    const template = await this.prisma.projectTemplate.findFirst({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        name,
        deletedAt: null,
      },
      include: childrenInclude,
    });

    return template ? toTemplateRecord(template) : null;
  }

  async list(scope: ProjectTemplateScope): Promise<readonly ProjectTemplateRecord[]> {
    const templates = await this.prisma.projectTemplate.findMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
      },
      include: childrenInclude,
      orderBy: [{ name: 'asc' }],
    });

    return templates.map(toTemplateRecord);
  }

  async countActive(scope: ProjectTemplateScope): Promise<number> {
    return this.prisma.projectTemplate.count({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
      },
    });
  }

  private async replaceChildren(
    db: ProjectTemplateTransactionClient | PrismaService,
    scope: { tenantId: string; workspaceId: string; templateId: string },
    milestones: readonly NestedTemplateMilestoneInput[],
    tasks: readonly NestedTemplateTaskInput[],
    deliverables: CreateProjectTemplateData['deliverables'],
    requiredDocuments: CreateProjectTemplateData['requiredDocuments'],
  ): Promise<void> {
    await db.projectTemplateTask.deleteMany({ where: { templateId: scope.templateId } });
    await db.projectTemplateDeliverable.deleteMany({ where: { templateId: scope.templateId } });
    await db.projectTemplateRequiredDocument.deleteMany({
      where: { templateId: scope.templateId },
    });
    await db.projectTemplateMilestone.deleteMany({ where: { templateId: scope.templateId } });

    const now = new Date();
    const milestoneIdByTempKey = new Map<string, string>();
    const milestoneIdBySortOrder = new Map<number, string>();

    for (let index = 0; index < milestones.length; index += 1) {
      const milestone = milestones[index];
      const id = randomUUID();
      const sortOrder = milestone.sortOrder ?? index;
      const tempKey = milestone.tempKey ?? `ms-${String(sortOrder)}`;
      milestoneIdByTempKey.set(tempKey, id);
      milestoneIdBySortOrder.set(sortOrder, id);

      await db.projectTemplateMilestone.create({
        data: {
          id,
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          templateId: scope.templateId,
          name: milestone.name.trim(),
          description: milestone.description ?? null,
          offsetDays: milestone.offsetDays ?? 0,
          sortOrder,
          createdAt: now,
          updatedAt: now,
        },
      });
    }

    for (let index = 0; index < tasks.length; index += 1) {
      const task = tasks[index];
      let templateMilestoneId: string | null = null;
      if (task.milestoneTempKey) {
        templateMilestoneId = milestoneIdByTempKey.get(task.milestoneTempKey) ?? null;
      } else if (task.milestoneSortOrder !== undefined && task.milestoneSortOrder !== null) {
        templateMilestoneId = milestoneIdBySortOrder.get(task.milestoneSortOrder) ?? null;
      }

      await db.projectTemplateTask.create({
        data: {
          id: randomUUID(),
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          templateId: scope.templateId,
          templateMilestoneId,
          title: task.title.trim(),
          description: task.description ?? null,
          priority: task.priority ?? 'MEDIUM',
          estimatedHours:
            task.estimatedHours === undefined || task.estimatedHours === null
              ? null
              : new Prisma.Decimal(task.estimatedHours),
          offsetDays: task.offsetDays ?? 0,
          sortOrder: task.sortOrder ?? index,
          checklistJson:
            task.checklistJson === undefined
              ? Prisma.JsonNull
              : (task.checklistJson as Prisma.InputJsonValue),
          createdAt: now,
          updatedAt: now,
        },
      });
    }

    const deliverableItems = deliverables ?? [];
    for (let index = 0; index < deliverableItems.length; index += 1) {
      const item = deliverableItems[index];
      await db.projectTemplateDeliverable.create({
        data: {
          id: randomUUID(),
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          templateId: scope.templateId,
          title: item.title.trim(),
          description: item.description ?? null,
          sortOrder: item.sortOrder ?? index,
          createdAt: now,
          updatedAt: now,
        },
      });
    }

    const requiredDocumentItems = requiredDocuments ?? [];
    for (let index = 0; index < requiredDocumentItems.length; index += 1) {
      const item = requiredDocumentItems[index];
      await db.projectTemplateRequiredDocument.create({
        data: {
          id: randomUUID(),
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          templateId: scope.templateId,
          title: item.title.trim(),
          folder: item.folder ?? null,
          sortOrder: item.sortOrder ?? index,
          createdAt: now,
          updatedAt: now,
        },
      });
    }
  }
}

type TemplateWithChildren = Prisma.ProjectTemplateGetPayload<{
  include: typeof childrenInclude;
}>;

function toTemplateRecord(template: TemplateWithChildren): ProjectTemplateRecord {
  return {
    id: template.id,
    tenantId: template.tenantId,
    workspaceId: template.workspaceId,
    name: template.name,
    description: template.description,
    serviceType: template.serviceType,
    defaultDurationDays: template.defaultDurationDays,
    defaultEstimatedHours: template.defaultEstimatedHours?.toNumber() ?? null,
    isActive: template.isActive,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
    createdByUserId: template.createdByUserId,
    updatedByUserId: template.updatedByUserId,
    deletedAt: template.deletedAt,
    deletedByUserId: template.deletedByUserId,
    milestones: template.milestones.map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description,
      offsetDays: m.offsetDays,
      sortOrder: m.sortOrder,
    })),
    tasks: template.tasks.map((t) => ({
      id: t.id,
      templateMilestoneId: t.templateMilestoneId,
      title: t.title,
      description: t.description,
      priority: t.priority,
      estimatedHours: t.estimatedHours?.toNumber() ?? null,
      offsetDays: t.offsetDays,
      sortOrder: t.sortOrder,
      checklistJson: t.checklistJson,
    })),
    deliverables: template.deliverables.map((d) => ({
      id: d.id,
      title: d.title,
      description: d.description,
      sortOrder: d.sortOrder,
    })),
    requiredDocuments: template.requiredDocuments.map((d) => ({
      id: d.id,
      title: d.title,
      folder: d.folder,
      sortOrder: d.sortOrder,
    })),
  };
}
