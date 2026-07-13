import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ActivityService } from '../../../activities/services/activity.service';
import { NOTIFICATION_EVENT_KEYS } from '../../../notifications/events/notification-event.catalog';
import { ProjectNotificationEmitter } from '../../../notifications/events/project-notification.emitter';
import { PrismaService } from '../../../prisma/prisma.service';

const POLL_INTERVAL_MS = 60_000;

interface OverdueTaskCandidate {
  readonly id: string;
  readonly title: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly projectId: string;
  readonly assigneeUserId: string;
  readonly projectName: string;
}

interface OverdueMilestoneCandidate {
  readonly id: string;
  readonly name: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly projectId: string;
  readonly ownerUserId: string | null;
  readonly projectManagerUserId: string | null;
  readonly projectName: string;
}

interface OverdueProjectCandidate {
  readonly id: string;
  readonly name: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly projectManagerUserId: string | null;
}

@Injectable()
export class ProjectDeliverySchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ProjectDeliverySchedulerService.name);
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private ticking = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: ActivityService,
    private readonly projectNotificationEmitter: ProjectNotificationEmitter,
  ) {}

  onModuleInit(): void {
    this.intervalHandle = setInterval(() => {
      void this.tick();
    }, POLL_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    if (this.intervalHandle !== null) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  async tick(): Promise<void> {
    if (this.ticking) {
      return;
    }

    this.ticking = true;
    try {
      const todayUtc = startOfUtcDay(new Date());
      const dateKey = formatUtcDate(todayUtc);

      const overdueTasks = await this.findOverdueTasks(todayUtc);
      for (const task of overdueTasks) {
        await this.emitTaskOverdue(task, dateKey);
      }

      const overdueMilestones = await this.findOverdueMilestones(todayUtc);
      for (const milestone of overdueMilestones) {
        await this.emitMilestoneOverdue(milestone, dateKey);
      }

      const overdueProjects = await this.findOverdueProjects(todayUtc);
      for (const project of overdueProjects) {
        if (project.projectManagerUserId !== null) {
          await this.emitProjectOverdue(
            { ...project, projectManagerUserId: project.projectManagerUserId },
            dateKey,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        'Project delivery scheduler tick failed',
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.ticking = false;
    }
  }

  private async findOverdueTasks(todayUtc: Date): Promise<readonly OverdueTaskCandidate[]> {
    const rows = await this.prisma.task.findMany({
      where: {
        deletedAt: null,
        dueDate: { lt: todayUtc },
        status: { notIn: ['COMPLETED', 'CANCELLED', 'ARCHIVED'] },
        assigneeUserId: { not: null },
      },
      select: {
        id: true,
        title: true,
        tenantId: true,
        workspaceId: true,
        projectId: true,
        assigneeUserId: true,
        project: { select: { name: true } },
      },
    });

    return rows
      .filter((row): row is typeof row & { assigneeUserId: string } => row.assigneeUserId !== null)
      .map((row) => ({
        id: row.id,
        title: row.title,
        tenantId: row.tenantId,
        workspaceId: row.workspaceId,
        projectId: row.projectId,
        assigneeUserId: row.assigneeUserId,
        projectName: row.project.name,
      }));
  }

  private async findOverdueMilestones(
    todayUtc: Date,
  ): Promise<readonly OverdueMilestoneCandidate[]> {
    const rows = await this.prisma.projectMilestone.findMany({
      where: {
        deletedAt: null,
        dueDate: { lt: todayUtc },
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
        project: { deletedAt: null, status: { notIn: ['COMPLETED', 'CANCELLED', 'ARCHIVED'] } },
      },
      select: {
        id: true,
        name: true,
        tenantId: true,
        workspaceId: true,
        projectId: true,
        ownerUserId: true,
        project: {
          select: {
            name: true,
            projectManagerUserId: true,
          },
        },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      tenantId: row.tenantId,
      workspaceId: row.workspaceId,
      projectId: row.projectId,
      ownerUserId: row.ownerUserId,
      projectManagerUserId: row.project.projectManagerUserId,
      projectName: row.project.name,
    }));
  }

  private async findOverdueProjects(todayUtc: Date): Promise<readonly OverdueProjectCandidate[]> {
    const rows = await this.prisma.project.findMany({
      where: {
        deletedAt: null,
        targetEndDate: { lt: todayUtc },
        status: { notIn: ['COMPLETED', 'CANCELLED', 'ARCHIVED'] },
        projectManagerUserId: { not: null },
      },
      select: {
        id: true,
        name: true,
        tenantId: true,
        workspaceId: true,
        projectManagerUserId: true,
      },
    });

    return rows.filter(
      (row): row is OverdueProjectCandidate & { projectManagerUserId: string } =>
        row.projectManagerUserId !== null,
    );
  }

  private async emitTaskOverdue(task: OverdueTaskCandidate, dateKey: string): Promise<void> {
    const dedupeKey = `project.task_overdue:${task.id}:${dateKey}`;
    const tickStartedAt = Date.now();

    const activity = await this.activityService.logSystemEvent(
      { tenantId: task.tenantId, workspaceId: task.workspaceId },
      {
        entityType: 'task',
        entityId: task.id,
        type: 'CUSTOM',
        title: 'Task overdue',
        description: `Task "${task.title}" on project "${task.projectName}" is overdue.`,
        dedupeKey,
        metadata: {
          notificationEventKey: NOTIFICATION_EVENT_KEYS.PROJECT_TASK_OVERDUE,
          projectId: task.projectId,
        },
      },
      { actorUserId: task.assigneeUserId },
    );

    if (activity.createdAt.getTime() < tickStartedAt - 2_000) {
      return;
    }

    try {
      await this.projectNotificationEmitter.emit(
        NOTIFICATION_EVENT_KEYS.PROJECT_TASK_OVERDUE,
        { tenantId: task.tenantId, workspaceId: task.workspaceId },
        task.assigneeUserId,
        { title: task.title, projectName: task.projectName },
        {
          entityType: 'Task',
          entityId: task.id,
          linkPath: `/projects/${task.projectId}/tasks/${task.id}`,
        },
      );
    } catch (error) {
      this.logger.warn(
        `Failed to emit PROJECT_TASK_OVERDUE for task ${task.id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async emitMilestoneOverdue(
    milestone: OverdueMilestoneCandidate,
    dateKey: string,
  ): Promise<void> {
    const recipientUserId = milestone.ownerUserId ?? milestone.projectManagerUserId;
    if (recipientUserId === null) {
      return;
    }

    const dedupeKey = `project.milestone_overdue:${milestone.id}:${dateKey}`;
    const tickStartedAt = Date.now();

    const activity = await this.activityService.logSystemEvent(
      { tenantId: milestone.tenantId, workspaceId: milestone.workspaceId },
      {
        entityType: 'project',
        entityId: milestone.projectId,
        type: 'CUSTOM',
        title: 'Milestone overdue',
        description: `Milestone "${milestone.name}" on project "${milestone.projectName}" is overdue.`,
        dedupeKey,
        metadata: {
          notificationEventKey: NOTIFICATION_EVENT_KEYS.PROJECT_MILESTONE_OVERDUE,
          milestoneId: milestone.id,
        },
      },
      { actorUserId: recipientUserId },
    );

    if (activity.createdAt.getTime() < tickStartedAt - 2_000) {
      return;
    }

    try {
      await this.projectNotificationEmitter.emit(
        NOTIFICATION_EVENT_KEYS.PROJECT_MILESTONE_OVERDUE,
        { tenantId: milestone.tenantId, workspaceId: milestone.workspaceId },
        recipientUserId,
        { title: milestone.name, projectName: milestone.projectName },
        {
          entityType: 'ProjectMilestone',
          entityId: milestone.id,
          linkPath: `/projects/${milestone.projectId}/milestones/${milestone.id}`,
        },
      );
    } catch (error) {
      this.logger.warn(
        `Failed to emit PROJECT_MILESTONE_OVERDUE for milestone ${milestone.id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async emitProjectOverdue(
    project: OverdueProjectCandidate & { projectManagerUserId: string },
    dateKey: string,
  ): Promise<void> {
    const dedupeKey = `project.overdue:${project.id}:${dateKey}`;
    const tickStartedAt = Date.now();

    const activity = await this.activityService.logSystemEvent(
      { tenantId: project.tenantId, workspaceId: project.workspaceId },
      {
        entityType: 'project',
        entityId: project.id,
        type: 'CUSTOM',
        title: 'Project overdue',
        description: `Project "${project.name}" is past its target end date.`,
        dedupeKey,
        metadata: {
          notificationEventKey: NOTIFICATION_EVENT_KEYS.PROJECT_OVERDUE,
        },
      },
      { actorUserId: project.projectManagerUserId },
    );

    if (activity.createdAt.getTime() < tickStartedAt - 2_000) {
      return;
    }

    try {
      await this.projectNotificationEmitter.emit(
        NOTIFICATION_EVENT_KEYS.PROJECT_OVERDUE,
        { tenantId: project.tenantId, workspaceId: project.workspaceId },
        project.projectManagerUserId,
        { title: project.name },
        {
          entityType: 'Project',
          entityId: project.id,
          linkPath: `/projects/${project.id}`,
        },
      );
    } catch (error) {
      this.logger.warn(
        `Failed to emit PROJECT_OVERDUE for project ${project.id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function formatUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
