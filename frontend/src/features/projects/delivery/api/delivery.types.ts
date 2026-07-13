import type { ProjectPriority, ProjectStatus } from '@/features/projects/types';
import type { ProjectServiceType } from '@/features/projects/templates/api/template.types';

export type ProjectHealthStatus = 'GREEN' | 'YELLOW' | 'RED';

export interface ProjectDeliveryHealthDistribution {
  readonly green: number;
  readonly yellow: number;
  readonly red: number;
  readonly unknown: number;
}

export interface ProjectDeliveryUpcomingMilestone {
  readonly id: string;
  readonly projectId: string;
  readonly projectName: string;
  readonly name: string;
  readonly dueDate: string | null;
  readonly status: string;
  readonly completionPercent: number;
}

export interface ProjectDeliveryDashboard {
  readonly activeProjects: number;
  readonly completedProjects: number;
  readonly overdueProjects: number;
  readonly teamUtilization: number;
  readonly upcomingMilestones: readonly ProjectDeliveryUpcomingMilestone[];
  readonly healthDistribution: ProjectDeliveryHealthDistribution;
}

export interface ProjectHealthFactors {
  readonly daysRemaining: number | null;
  readonly completionPercent: number | null;
  readonly hoursUtilizationPercent: number | null;
  readonly budgetUtilizationPercent: number | null;
  readonly overdueMilestoneCount: number;
  readonly overdueTaskCount: number;
}

export interface ProjectHealthResult {
  readonly score: number;
  readonly status: ProjectHealthStatus;
  readonly factors: ProjectHealthFactors;
  readonly calculatedAt: string | null;
}

export interface ProjectHoursSummary {
  readonly estimatedHours: number | null;
  readonly actualHours: number | null;
  readonly remainingHours: number | null;
  readonly utilizationPercent: number | null;
  readonly billableHours: number | null;
  readonly nonBillableHours: number | null;
}

export interface ProjectWorkspaceResult {
  readonly projectId: string;
  readonly health: ProjectHealthResult | null;
  readonly hours: ProjectHoursSummary | null;
  readonly milestoneCount: number;
  readonly openTaskCount: number;
  readonly memberCount: number;
}

export interface ProjectPortalResult {
  readonly projectId: string;
  readonly name: string;
  readonly status: ProjectStatus;
  readonly serviceType: ProjectServiceType | null;
  readonly targetEndDate: string | null;
  readonly completionPercent: number | null;
  readonly milestones: readonly {
    readonly id: string;
    readonly name: string;
    readonly status: string;
    readonly dueDate: string | null;
    readonly completionPercent: number;
  }[];
  readonly deliverables: readonly {
    readonly id: string;
    readonly title: string;
    readonly status: string;
  }[];
}

export interface CreateProjectFromDealPayload {
  readonly dealId: string;
  readonly templateId?: string;
  readonly name?: string;
  readonly projectManagerUserId?: string;
}

export interface CreateProjectFromClientPayload {
  readonly clientId: string;
  readonly name: string;
  readonly templateId?: string;
  readonly projectManagerUserId?: string;
  readonly primaryContactId?: string;
  readonly serviceType?: ProjectServiceType;
  readonly startDate?: string;
  readonly targetEndDate?: string;
  readonly priority?: ProjectPriority;
  readonly description?: string;
}
