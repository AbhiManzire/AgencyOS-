import type { ClientRenewalRecord } from '@/features/clients/success/api/client-renewals.types';

/** Client health status from ClientHealthStatus enum. */
export type ClientHealthStatus = 'GREEN' | 'YELLOW' | 'RED';

export type ClientDocumentFolder =
  'CONTRACTS' | 'INVOICES' | 'PROPOSALS' | 'NDA' | 'PURCHASE_ORDERS' | 'DESIGN_FILES' | 'OTHER';

export const CLIENT_DOCUMENT_FOLDERS: readonly ClientDocumentFolder[] = [
  'CONTRACTS',
  'INVOICES',
  'PROPOSALS',
  'NDA',
  'PURCHASE_ORDERS',
  'DESIGN_FILES',
  'OTHER',
] as const;

export const CLIENT_DOCUMENT_FOLDER_LABELS: Record<ClientDocumentFolder, string> = {
  CONTRACTS: 'Contracts',
  INVOICES: 'Invoices',
  PROPOSALS: 'Proposals',
  NDA: 'NDA',
  PURCHASE_ORDERS: 'Purchase Orders',
  DESIGN_FILES: 'Design Files',
  OTHER: 'Other',
};

export interface ClientSuccessHealthDistribution {
  readonly green: number;
  readonly yellow: number;
  readonly red: number;
  readonly unknown: number;
}

export interface ClientAtRiskItem {
  readonly id: string;
  readonly displayName: string;
  readonly healthStatus: ClientHealthStatus | null;
  readonly outstanding: number;
  readonly nextRenewalDate: string | null;
}

export interface ClientSuccessDashboard {
  readonly activeClients: number;
  readonly newClients: number;
  readonly revenue: number;
  readonly outstanding: number;
  readonly renewalsThisMonth: number;
  readonly healthDistribution: ClientSuccessHealthDistribution;
  readonly clientsAtRisk: readonly ClientAtRiskItem[];
}

export interface ClientHealthFactors {
  readonly daysSinceLastActivity: number | null;
  readonly overdueInvoiceCount: number;
  readonly delayedProjectCount: number;
  readonly overdueRenewalCount: number;
  readonly overdueFollowUpCount: number;
  readonly activityPenalty: number;
  readonly overdueInvoicePenalty: number;
  readonly delayedProjectPenalty: number;
  readonly overdueRenewalPenalty: number;
  readonly overdueFollowUpPenalty: number;
}

export interface ClientHealthResult {
  readonly score: number;
  readonly status: ClientHealthStatus;
  readonly factors: ClientHealthFactors;
}

export interface ClientMetrics {
  readonly lifetimeRevenue: number;
  readonly outstanding: number;
  readonly paidAmount: number;
  readonly activeProjects: number;
  readonly completedProjects: number;
  readonly openDeals: number;
  readonly lastActivityAt: string | null;
  readonly lastInvoiceAt: string | null;
  readonly renewalDate: string | null;
  readonly healthScore: number;
  readonly healthStatus: ClientHealthStatus;
  readonly clientSince: string | null;
}

/** Minimal deal row from GET /clients/:id/workspace. */
export interface ClientWorkspaceDeal {
  readonly id: string;
  readonly title: string;
  readonly stage: string;
  readonly status: string;
  readonly value: number | string;
  readonly currency: string;
  readonly expectedCloseDate: string | null;
  readonly wonAt: string | null;
  readonly updatedAt: string;
}

/** Minimal project row from GET /clients/:id/workspace. */
export interface ClientWorkspaceProject {
  readonly id: string;
  readonly name: string;
  readonly code: string | null;
  readonly status: string;
  readonly priority: string;
  readonly startDate: string | null;
  readonly targetEndDate: string | null;
  readonly budgetAmount: number | string | null;
  readonly updatedAt: string;
}

/** Minimal invoice row from GET /clients/:id/workspace. */
export interface ClientWorkspaceInvoice {
  readonly id: string;
  readonly invoiceNumber: string;
  readonly status: string;
  readonly issueDate: string;
  readonly dueDate: string;
  readonly currency: string;
  readonly grandTotal: number | string | null;
  readonly balanceDue: number | string | null;
}

export interface ClientWorkspacePayment {
  readonly id: string;
  readonly invoiceId: string;
  readonly amount: number;
  readonly currency: string;
  readonly status: string;
  readonly method: string;
  readonly paidAt: string;
  readonly reference: string | null;
}

export interface ClientWorkspaceResult {
  readonly metrics: ClientMetrics;
  readonly health: ClientHealthResult;
  readonly deals: readonly ClientWorkspaceDeal[];
  readonly projects: readonly ClientWorkspaceProject[];
  readonly invoices: readonly ClientWorkspaceInvoice[];
  readonly payments: readonly ClientWorkspacePayment[];
  readonly renewals: readonly ClientRenewalRecord[];
  readonly contactsCount: number;
}

export interface ConvertFromDealPayload {
  readonly dealId: string;
}

export interface ConvertFromDealResult {
  readonly client: {
    readonly id: string;
    readonly displayName: string;
    readonly status: string;
  };
  readonly dealId: string;
  readonly metrics: ClientMetrics;
}

export interface MergeClientsPayload {
  readonly sourceClientId: string;
  readonly targetClientId: string;
}

export interface MergeClientsResult {
  readonly client: {
    readonly id: string;
    readonly displayName: string;
  };
  readonly moved: {
    readonly deals: number;
    readonly projects: number;
    readonly invoices: number;
    readonly quotes: number;
    readonly contacts: number;
    readonly tags: number;
    readonly renewals: number;
    readonly salesTasks: number;
    readonly comments: number;
    readonly files: number;
    readonly activities: number;
    readonly followUps: number;
    readonly leads: number;
    readonly creditNotes: number;
    readonly ledgerEntries: number;
  };
}

export interface ListClientTimelineParams {
  readonly skip?: number;
  readonly take?: number;
}
