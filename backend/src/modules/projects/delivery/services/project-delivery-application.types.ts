import type { ProjectHealthStatus, ProjectMilestoneStatus } from '@prisma/client';
import type { ProjectRecord, ProjectScope } from '../../repositories/project.repository.interface';

export interface ProjectDeliveryApplicationContext {
  readonly actorUserId: string;
}

export interface CreateProjectFromDealCommand {
  readonly dealId: string;
  readonly templateId?: string | null;
  readonly name?: string | null;
  readonly projectManagerUserId?: string | null;
}

export interface CreateProjectFromClientCommand {
  readonly clientId: string;
  readonly name: string;
  readonly templateId?: string | null;
  readonly projectManagerUserId?: string | null;
  readonly primaryContactId?: string | null;
  readonly serviceType?: import('@prisma/client').ProjectServiceType | null;
  readonly startDate?: Date | null;
  readonly targetEndDate?: Date | null;
}

export interface DeliveryDashboardResult {
  readonly activeProjects: number;
  readonly completedProjects: number;
  readonly overdueProjects: number;
  readonly teamUtilization: number | null;
  readonly upcomingMilestones: readonly UpcomingMilestoneSummary[];
  readonly healthDistribution: HealthDistribution;
}

export interface UpcomingMilestoneSummary {
  readonly id: string;
  readonly projectId: string;
  readonly projectName: string;
  readonly name: string;
  readonly dueDate: Date | null;
  readonly status: ProjectMilestoneStatus;
}

export interface HealthDistribution {
  readonly green: number;
  readonly yellow: number;
  readonly red: number;
  readonly unknown: number;
}

export interface ProjectWorkspaceResult {
  readonly project: ProjectRecord;
  readonly milestones: readonly WorkspaceMilestoneSummary[];
  readonly taskCountsByStatus: Readonly<Record<string, number>>;
  readonly members: readonly WorkspaceMemberSummary[];
  readonly filesCount: number;
  readonly invoices: readonly WorkspaceInvoiceSummary[];
  readonly payments: readonly WorkspacePaymentSummary[];
  readonly clientSummary: WorkspaceClientSummary | null;
  readonly deliverables: readonly WorkspaceDeliverableSummary[];
  readonly health: ProjectHealthSummary | null;
  readonly hoursSummary: HoursSummary;
}

export interface WorkspaceMilestoneSummary {
  readonly id: string;
  readonly name: string;
  readonly status: ProjectMilestoneStatus;
  readonly dueDate: Date | null;
  readonly completionPercent: number;
  readonly sortOrder: number;
}

export interface WorkspaceMemberSummary {
  readonly id: string;
  readonly userId: string;
  readonly role: string;
  readonly allocationPercent: number | null;
  readonly status: string;
  readonly displayName: string | null;
  readonly email: string | null;
}

export interface WorkspaceInvoiceSummary {
  readonly id: string;
  readonly invoiceNumber: string;
  readonly status: string;
  readonly grandTotal: number | null;
  readonly balanceDue: number | null;
  readonly dueDate: Date;
}

export interface WorkspacePaymentSummary {
  readonly id: string;
  readonly invoiceId: string;
  readonly amount: number;
  readonly paidAt: Date;
}

export interface WorkspaceClientSummary {
  readonly id: string;
  readonly displayName: string;
  readonly status: string;
  readonly email: string | null;
  readonly phone: string | null;
}

export interface WorkspaceDeliverableSummary {
  readonly id: string;
  readonly title: string;
  readonly status: string;
  readonly sortOrder: number;
}

export interface ProjectHealthSummary {
  readonly status: ProjectHealthStatus | null;
  readonly score: number | null;
  readonly calculatedAt: Date | null;
}

export interface HoursSummary {
  readonly billableMinutes: number;
  readonly nonBillableMinutes: number;
  readonly totalMinutes: number;
}

export interface ProjectPortalResult {
  readonly project: Pick<ProjectRecord, 'id' | 'name' | 'status' | 'clientId'>;
  readonly progressPercent: number;
  readonly milestones: readonly WorkspaceMilestoneSummary[];
  readonly files: readonly PortalFileSummary[];
  readonly invoices: readonly WorkspaceInvoiceSummary[];
  readonly deliverables: readonly WorkspaceDeliverableSummary[];
  readonly approvals: readonly WorkspaceDeliverableSummary[];
}

export interface PortalFileSummary {
  readonly id: string;
  readonly name: string;
  readonly mimeType: string | null;
  readonly sizeBytes: number | null;
  readonly createdAt: Date;
}

export interface ProjectHealthCalculation {
  readonly score: number;
  readonly status: ProjectHealthStatus;
}

export type { ProjectRecord, ProjectScope };
