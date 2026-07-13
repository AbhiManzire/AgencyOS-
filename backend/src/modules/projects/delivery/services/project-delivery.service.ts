import { Inject, Injectable } from '@nestjs/common';
import { ProjectServiceType } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CLIENT_CONTACT_REPOSITORY,
  type ClientContactRepository,
} from '../../../clients/repositories/client-contact.repository.interface';
import {
  PROJECT_REPOSITORY,
  type ProjectRecord,
  type ProjectRepository,
  type ProjectScope,
} from '../../repositories/project.repository.interface';
import { ProjectService } from '../../services/project.service';
import {
  PROJECT_DELIVERY_DOMAIN_ERROR_CODES,
  ProjectDeliveryDomainError,
} from '../domain/project-delivery-domain.errors';
import type {
  CreateProjectFromClientCommand,
  CreateProjectFromDealCommand,
  DeliveryDashboardResult,
  HoursSummary,
  ProjectDeliveryApplicationContext,
  ProjectPortalResult,
  ProjectWorkspaceResult,
  UpcomingMilestoneSummary,
} from './project-delivery-application.types';
import { ProjectHealthService } from './project-health.service';

const ACTIVE_PROJECT_STATUSES = ['ACTIVE', 'PLANNING', 'ON_HOLD'] as const;
const TERMINAL_PROJECT_STATUSES = ['COMPLETED', 'CANCELLED', 'ARCHIVED'] as const;

const PROJECT_SERVICE_TYPE_VALUES = new Set<string>(Object.values(ProjectServiceType));

@Injectable()
export class ProjectDeliveryService {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
    @Inject(CLIENT_CONTACT_REPOSITORY)
    private readonly clientContactRepository: ClientContactRepository,
    private readonly projectService: ProjectService,
    private readonly projectHealthService: ProjectHealthService,
    private readonly prisma: PrismaService,
  ) {}

  async createFromDeal(
    scope: ProjectScope,
    command: CreateProjectFromDealCommand,
    context: ProjectDeliveryApplicationContext,
  ): Promise<ProjectRecord> {
    const deal = await this.prisma.deal.findFirst({
      where: {
        id: command.dealId,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
      },
    });

    if (deal === null) {
      throw new ProjectDeliveryDomainError(
        PROJECT_DELIVERY_DOMAIN_ERROR_CODES.DEAL_NOT_FOUND,
        'Deal was not found.',
      );
    }

    if (deal.stage !== 'WON') {
      throw new ProjectDeliveryDomainError(
        PROJECT_DELIVERY_DOMAIN_ERROR_CODES.DEAL_NOT_WON,
        'Deal must be in WON stage to create a project.',
      );
    }

    const projectManagerUserId =
      command.projectManagerUserId ?? deal.ownerUserId ?? context.actorUserId;

    const trimmedName = command.name?.trim();
    const project = await this.projectService.createProject(
      scope,
      {
        clientId: deal.clientId,
        name: trimmedName !== undefined && trimmedName.length > 0 ? trimmedName : deal.title,
        projectManagerUserId,
        dealId: deal.id,
        templateId: command.templateId ?? null,
        primaryContactId: deal.contactId,
        serviceType: mapDealServiceToProjectServiceType(deal.service),
        serviceLabel: deal.service,
        budgetAmount: deal.value.toNumber(),
        status: 'PLANNING',
      },
      { actorUserId: context.actorUserId },
    );

    if (deal.convertedProjectId === null) {
      await this.prisma.deal.update({
        where: { id: deal.id },
        data: { convertedProjectId: project.id },
      });
    }

    return project;
  }

  async createFromClient(
    scope: ProjectScope,
    command: CreateProjectFromClientCommand,
    context: ProjectDeliveryApplicationContext,
  ): Promise<ProjectRecord> {
    const client = await this.prisma.client.findFirst({
      where: {
        id: command.clientId,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
      },
    });

    if (client === null) {
      throw new ProjectDeliveryDomainError(
        PROJECT_DELIVERY_DOMAIN_ERROR_CODES.CLIENT_NOT_FOUND,
        'Client was not found.',
      );
    }

    const primaryContactId = await this.resolvePrimaryContactId(scope, command);

    const projectManagerUserId = command.projectManagerUserId ?? context.actorUserId;

    const project = await this.projectService.createProject(
      scope,
      {
        clientId: command.clientId,
        name: command.name.trim(),
        projectManagerUserId,
        templateId: command.templateId ?? null,
        primaryContactId,
        serviceType: command.serviceType ?? null,
        startDate: command.startDate ?? null,
        targetEndDate: command.targetEndDate ?? null,
        status: 'PLANNING',
      },
      { actorUserId: context.actorUserId },
    );

    return project;
  }

  async getDeliveryDashboard(scope: ProjectScope): Promise<DeliveryDashboardResult> {
    const today = startOfUtcDay(new Date());
    const inFourteenDays = addUtcDays(today, 14);

    const baseWhere = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      deletedAt: null,
    };

    const [
      activeProjects,
      completedProjects,
      overdueProjects,
      healthRows,
      upcomingMilestones,
      members,
    ] = await Promise.all([
      this.prisma.project.count({
        where: { ...baseWhere, status: { in: [...ACTIVE_PROJECT_STATUSES] } },
      }),
      this.prisma.project.count({
        where: { ...baseWhere, status: 'COMPLETED' },
      }),
      this.prisma.project.count({
        where: {
          ...baseWhere,
          targetEndDate: { lt: today },
          status: { notIn: [...TERMINAL_PROJECT_STATUSES] },
        },
      }),
      this.prisma.project.findMany({
        where: baseWhere,
        select: { healthStatus: true },
      }),
      this.prisma.projectMilestone.findMany({
        where: {
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          deletedAt: null,
          dueDate: { gte: today, lte: inFourteenDays },
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
          project: {
            deletedAt: null,
            status: { in: [...ACTIVE_PROJECT_STATUSES] },
          },
        },
        orderBy: [{ dueDate: 'asc' }],
        take: 10,
        select: {
          id: true,
          projectId: true,
          name: true,
          dueDate: true,
          status: true,
          project: { select: { name: true } },
        },
      }),
      this.prisma.projectMember.findMany({
        where: {
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          deletedAt: null,
          status: 'ACTIVE',
          project: {
            deletedAt: null,
            status: { in: [...ACTIVE_PROJECT_STATUSES] },
          },
        },
        select: { allocationPercent: true },
      }),
    ]);

    const healthDistribution = {
      green: 0,
      yellow: 0,
      red: 0,
      unknown: 0,
    };

    for (const row of healthRows) {
      switch (row.healthStatus) {
        case 'GREEN':
          healthDistribution.green += 1;
          break;
        case 'YELLOW':
          healthDistribution.yellow += 1;
          break;
        case 'RED':
          healthDistribution.red += 1;
          break;
        default:
          healthDistribution.unknown += 1;
      }
    }

    const allocations = members
      .map((member) => member.allocationPercent)
      .filter((value): value is number => value !== null);

    const teamUtilization =
      allocations.length > 0
        ? Math.round(allocations.reduce((sum, value) => sum + value, 0) / allocations.length)
        : null;

    return {
      activeProjects,
      completedProjects,
      overdueProjects,
      teamUtilization,
      upcomingMilestones: upcomingMilestones.map((milestone): UpcomingMilestoneSummary => ({
        id: milestone.id,
        projectId: milestone.projectId,
        projectName: milestone.project.name,
        name: milestone.name,
        dueDate: milestone.dueDate,
        status: milestone.status,
      })),
      healthDistribution,
    };
  }

  async getWorkspace(scope: ProjectScope, projectId: string): Promise<ProjectWorkspaceResult> {
    const project = await this.projectService.getProject(scope, projectId);
    const hoursSummary = await this.getHoursSummary(scope, projectId);

    const [milestones, taskStatusGroups, members, filesCount, invoices, client, deliverables] =
      await Promise.all([
        this.prisma.projectMilestone.findMany({
          where: {
            tenantId: scope.tenantId,
            workspaceId: scope.workspaceId,
            projectId,
            deletedAt: null,
          },
          orderBy: [{ sortOrder: 'asc' }],
          select: {
            id: true,
            name: true,
            status: true,
            dueDate: true,
            completionPercent: true,
            sortOrder: true,
          },
        }),
        this.prisma.task.groupBy({
          by: ['status'],
          where: {
            tenantId: scope.tenantId,
            workspaceId: scope.workspaceId,
            projectId,
            deletedAt: null,
          },
          _count: { _all: true },
        }),
        this.prisma.projectMember.findMany({
          where: {
            tenantId: scope.tenantId,
            workspaceId: scope.workspaceId,
            projectId,
            deletedAt: null,
          },
          include: {
            user: { select: { displayName: true, email: true } },
          },
        }),
        this.prisma.file.count({
          where: {
            tenantId: scope.tenantId,
            workspaceId: scope.workspaceId,
            entityType: 'project',
            entityId: projectId,
          },
        }),
        this.prisma.invoice.findMany({
          where: {
            tenantId: scope.tenantId,
            workspaceId: scope.workspaceId,
            projectId,
            deletedAt: null,
          },
          orderBy: [{ dueDate: 'desc' }],
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            grandTotal: true,
            balanceDue: true,
            dueDate: true,
            payments: {
              where: { deletedAt: null },
              select: {
                id: true,
                amount: true,
                paidAt: true,
              },
            },
          },
        }),
        this.prisma.client.findFirst({
          where: {
            id: project.clientId,
            tenantId: scope.tenantId,
            workspaceId: scope.workspaceId,
            deletedAt: null,
          },
          select: {
            id: true,
            displayName: true,
            status: true,
            email: true,
            phone: true,
          },
        }),
        this.prisma.projectDeliverable.findMany({
          where: {
            tenantId: scope.tenantId,
            workspaceId: scope.workspaceId,
            projectId,
            deletedAt: null,
          },
          orderBy: [{ sortOrder: 'asc' }],
          select: {
            id: true,
            title: true,
            status: true,
            sortOrder: true,
          },
        }),
      ]);

    const taskCountsByStatus: Record<string, number> = {};
    for (const group of taskStatusGroups) {
      taskCountsByStatus[group.status] = group._count._all;
    }

    const invoiceSummaries = invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      grandTotal: invoice.grandTotal?.toNumber() ?? null,
      balanceDue: invoice.balanceDue?.toNumber() ?? null,
      dueDate: invoice.dueDate,
    }));

    const payments = invoices.flatMap((invoice) =>
      invoice.payments.map((payment) => ({
        id: payment.id,
        invoiceId: invoice.id,
        amount: payment.amount.toNumber(),
        paidAt: payment.paidAt,
      })),
    );

    return {
      project,
      milestones: milestones.map((milestone) => ({
        id: milestone.id,
        name: milestone.name,
        status: milestone.status,
        dueDate: milestone.dueDate,
        completionPercent: milestone.completionPercent,
        sortOrder: milestone.sortOrder,
      })),
      taskCountsByStatus,
      members: members.map((member) => ({
        id: member.id,
        userId: member.userId,
        role: member.role,
        allocationPercent: member.allocationPercent,
        status: member.status,
        displayName: member.user.displayName,
        email: member.user.email,
      })),
      filesCount,
      invoices: invoiceSummaries,
      payments,
      clientSummary: client
        ? {
            id: client.id,
            displayName: client.displayName,
            status: client.status,
            email: client.email,
            phone: client.phone,
          }
        : null,
      deliverables: deliverables.map((item) => ({
        id: item.id,
        title: item.title,
        status: item.status,
        sortOrder: item.sortOrder,
      })),
      health: {
        status: project.healthStatus,
        score: project.healthScore,
        calculatedAt: project.healthCalculatedAt,
      },
      hoursSummary,
    };
  }

  async getPortal(scope: ProjectScope, projectId: string): Promise<ProjectPortalResult> {
    const project = await this.projectService.getProject(scope, projectId);

    const [milestones, files, invoices, deliverables] = await Promise.all([
      this.prisma.projectMilestone.findMany({
        where: {
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          projectId,
          deletedAt: null,
        },
        orderBy: [{ sortOrder: 'asc' }],
        select: {
          id: true,
          name: true,
          status: true,
          dueDate: true,
          completionPercent: true,
          sortOrder: true,
        },
      }),
      this.prisma.file.findMany({
        where: {
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          entityType: 'project',
          entityId: projectId,
        },
        orderBy: [{ createdAt: 'desc' }],
        select: {
          id: true,
          originalName: true,
          fileName: true,
          mimeType: true,
          size: true,
          createdAt: true,
        },
      }),
      this.prisma.invoice.findMany({
        where: {
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          projectId,
          deletedAt: null,
          status: { not: 'DRAFT' },
        },
        orderBy: [{ dueDate: 'desc' }],
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
          grandTotal: true,
          balanceDue: true,
          dueDate: true,
        },
      }),
      this.prisma.projectDeliverable.findMany({
        where: {
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          projectId,
          deletedAt: null,
        },
        orderBy: [{ sortOrder: 'asc' }],
        select: {
          id: true,
          title: true,
          status: true,
          sortOrder: true,
        },
      }),
    ]);

    const progressPercent =
      milestones.length > 0
        ? Math.round(
            milestones.reduce((sum, milestone) => sum + milestone.completionPercent, 0) /
              milestones.length,
          )
        : 0;

    const deliverableSummaries = deliverables.map((item) => ({
      id: item.id,
      title: item.title,
      status: item.status,
      sortOrder: item.sortOrder,
    }));

    return {
      project: {
        id: project.id,
        name: project.name,
        status: project.status,
        clientId: project.clientId,
      },
      progressPercent,
      milestones: milestones.map((milestone) => ({
        id: milestone.id,
        name: milestone.name,
        status: milestone.status,
        dueDate: milestone.dueDate,
        completionPercent: milestone.completionPercent,
        sortOrder: milestone.sortOrder,
      })),
      files: files.map((file) => ({
        id: file.id,
        name: file.originalName || file.fileName,
        mimeType: file.mimeType,
        sizeBytes: Number(file.size),
        createdAt: file.createdAt,
      })),
      invoices: invoices.map((invoice) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        grandTotal: invoice.grandTotal?.toNumber() ?? null,
        balanceDue: invoice.balanceDue?.toNumber() ?? null,
        dueDate: invoice.dueDate,
      })),
      deliverables: deliverableSummaries,
      approvals: deliverableSummaries.filter((item) =>
        ['PENDING', 'IN_PROGRESS'].includes(item.status),
      ),
    };
  }

  async getHoursSummary(scope: ProjectScope, projectId: string): Promise<HoursSummary> {
    await this.projectService.getProject(scope, projectId);

    const entries = await this.prisma.timeEntry.findMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
        task: {
          projectId,
          deletedAt: null,
        },
      },
      select: {
        durationMinutes: true,
        billable: true,
      },
    });

    let billableMinutes = 0;
    let nonBillableMinutes = 0;

    for (const entry of entries) {
      const minutes = entry.durationMinutes ?? 0;
      if (entry.billable) {
        billableMinutes += minutes;
      } else {
        nonBillableMinutes += minutes;
      }
    }

    return {
      billableMinutes,
      nonBillableMinutes,
      totalMinutes: billableMinutes + nonBillableMinutes,
    };
  }

  private async resolvePrimaryContactId(
    scope: ProjectScope,
    command: CreateProjectFromClientCommand,
  ): Promise<string | null> {
    if (command.primaryContactId) {
      const contact = await this.clientContactRepository.findById(
        {
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          clientId: command.clientId,
        },
        command.primaryContactId,
      );

      if (contact === null) {
        throw new ProjectDeliveryDomainError(
          PROJECT_DELIVERY_DOMAIN_ERROR_CODES.PRIMARY_CONTACT_NOT_FOUND,
          'Primary contact was not found for this client.',
        );
      }

      return contact.id;
    }

    const contacts = await this.clientContactRepository.listByClient({
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      clientId: command.clientId,
    });

    const primary = contacts.find((contact) => contact.isPrimary);
    return primary?.id ?? null;
  }
}

function mapDealServiceToProjectServiceType(service: string | null): ProjectServiceType | null {
  if (service === null || service.trim().length === 0) {
    return null;
  }

  const normalized = service
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
  if (PROJECT_SERVICE_TYPE_VALUES.has(normalized)) {
    return normalized as ProjectServiceType;
  }

  return null;
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(date: Date, days: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));
}
