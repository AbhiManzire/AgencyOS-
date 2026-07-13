import { Inject, Injectable } from '@nestjs/common';
import type { ProjectHealthStatus } from '@prisma/client';
import { PROJECT_DOMAIN_ERROR_CODES, ProjectDomainError } from '../../domain/project-domain.errors';
import {
  PROJECT_REPOSITORY,
  type ProjectRecord,
  type ProjectRepository,
  type ProjectScope,
} from '../../repositories/project.repository.interface';
import { PrismaService } from '../../../prisma/prisma.service';
import type { ProjectHealthCalculation } from './project-delivery-application.types';

const TERMINAL_TASK_STATUSES = ['COMPLETED', 'CANCELLED', 'ARCHIVED'] as const;
const TERMINAL_MILESTONE_STATUSES = ['COMPLETED', 'CANCELLED'] as const;

@Injectable()
export class ProjectHealthService {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
    private readonly prisma: PrismaService,
  ) {}

  async calculate(scope: ProjectScope, projectId: string): Promise<ProjectHealthCalculation> {
    const project = await this.projectRepository.findById(scope, projectId);
    if (project === null) {
      throw new ProjectDomainError(
        PROJECT_DOMAIN_ERROR_CODES.PROJECT_NOT_FOUND,
        'Project was not found.',
      );
    }

    const today = startOfUtcDay(new Date());
    let score = 100;

    const delayedTasks = await this.prisma.task.count({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        projectId,
        deletedAt: null,
        dueDate: { lt: today },
        status: { notIn: [...TERMINAL_TASK_STATUSES] },
      },
    });
    score -= Math.min(delayedTasks * 5, 30);

    const overdueMilestones = await this.prisma.projectMilestone.count({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        projectId,
        deletedAt: null,
        dueDate: { lt: today },
        status: { notIn: [...TERMINAL_MILESTONE_STATUSES] },
      },
    });
    score -= Math.min(overdueMilestones * 8, 24);

    const budgetPenalty = await this.calculateBudgetPenalty(scope, project);
    score -= budgetPenalty;

    const pendingDeliverables = await this.prisma.projectDeliverable.count({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        projectId,
        deletedAt: null,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
    });
    score -= Math.min(pendingDeliverables * 3, 15);

    const blockedTasks = await this.prisma.task.count({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        projectId,
        deletedAt: null,
        status: 'BLOCKED',
      },
    });
    score -= Math.min(blockedTasks * 5, 15);

    const clampedScore = Math.max(0, Math.min(100, score));

    return {
      score: clampedScore,
      status: resolveHealthStatus(clampedScore),
    };
  }

  async refreshAndPersist(scope: ProjectScope, projectId: string): Promise<ProjectRecord> {
    const calculation = await this.calculate(scope, projectId);
    const now = new Date();

    const updated = await this.projectRepository.update(scope, projectId, {
      healthStatus: calculation.status,
      healthScore: calculation.score,
      healthCalculatedAt: now,
      updatedAt: now,
    });

    if (updated === null) {
      throw new ProjectDomainError(
        PROJECT_DOMAIN_ERROR_CODES.PROJECT_NOT_FOUND,
        'Project was not found.',
      );
    }

    return updated;
  }

  private async calculateBudgetPenalty(
    scope: ProjectScope,
    project: ProjectRecord,
  ): Promise<number> {
    let usageRatio: number | null = null;

    if (
      project.estimatedHours !== null &&
      project.estimatedHours > 0 &&
      project.actualHours !== null
    ) {
      usageRatio = project.actualHours / project.estimatedHours;
    } else if (project.budgetAmount !== null && project.budgetAmount > 0) {
      const invoices = await this.prisma.invoice.findMany({
        where: {
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          projectId: project.id,
          deletedAt: null,
          status: { not: 'DRAFT' },
        },
        select: {
          grandTotal: true,
          payments: {
            where: { deletedAt: null },
            select: { amount: true },
          },
        },
      });

      let paidTotal = 0;
      for (const invoice of invoices) {
        for (const payment of invoice.payments) {
          paidTotal += payment.amount.toNumber();
        }
      }

      usageRatio = paidTotal / project.budgetAmount;
    }

    if (usageRatio === null) {
      return 0;
    }

    if (usageRatio > 1) {
      return 20;
    }

    if (usageRatio > 0.8) {
      return 10;
    }

    return 0;
  }
}

function resolveHealthStatus(score: number): ProjectHealthStatus {
  if (score >= 70) {
    return 'GREEN';
  }

  if (score >= 40) {
    return 'YELLOW';
  }

  return 'RED';
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
