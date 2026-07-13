import type { LeadSource } from '@/features/sales/leads/types';
import type {
  DealForecastCategory,
  DealForecastPeriod,
  DealPriority,
  DealStage,
  DealStatus,
} from '@/features/sales/types';

/** Deal row returned by GET /deals — mirrors backend DealRecord. */
export interface DealRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly clientId: string;
  readonly clientName: string;
  readonly contactId: string | null;
  readonly contactName: string | null;
  readonly leadId: string | null;
  readonly pipelineId: string | null;
  readonly pipelineStageId: string | null;
  readonly title: string;
  readonly description: string | null;
  readonly value: number;
  readonly currency: string;
  readonly expectedCloseDate: string | null;
  readonly ownerUserId: string | null;
  readonly ownerDisplayName: string | null;
  readonly ownerEmail: string | null;
  readonly stage: DealStage;
  readonly status: DealStatus;
  readonly source: LeadSource | null;
  readonly forecastCategory: DealForecastCategory;
  readonly service: string | null;
  readonly probability: number | null;
  readonly priority: DealPriority;
  readonly stageEnteredAt: string | null;
  readonly convertedProjectId: string | null;
  readonly wonAt: string | null;
  readonly lostAt: string | null;
  readonly lossReason: string | null;
  readonly competitor: string | null;
  readonly lossNotes: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: string | null;
  readonly deletedByUserId: string | null;
}

export interface ListDealsParams {
  readonly skip?: number;
  readonly take?: number;
  readonly q?: string;
  readonly stage?: DealStage;
  readonly status?: DealStatus;
  readonly priority?: DealPriority;
  readonly ownerUserId?: string;
  readonly clientId?: string;
  readonly leadId?: string;
  readonly probabilityMin?: number;
  readonly probabilityMax?: number;
  readonly includeArchived?: boolean;
  readonly sortBy?:
    'updatedAt' | 'createdAt' | 'value' | 'probability' | 'expectedCloseDate' | 'title';
  readonly sortOrder?: 'asc' | 'desc';
}

export interface ListDealsResult {
  readonly items: readonly DealRecord[];
  readonly total: number;
  readonly skip: number;
  readonly take: number;
}

export interface CreateDealPayload {
  readonly clientId: string;
  readonly contactId?: string | null;
  readonly leadId?: string | null;
  readonly title: string;
  readonly description?: string | null;
  readonly value: number;
  readonly currency?: string;
  readonly expectedCloseDate?: string | null;
  readonly ownerUserId?: string | null;
  readonly stage?: DealStage;
  readonly source?: LeadSource | null;
  readonly forecastCategory?: DealForecastCategory;
  readonly service?: string | null;
  readonly probability?: number | null;
  readonly priority?: DealPriority;
}

export interface UpdateDealPayload {
  readonly clientId?: string;
  readonly contactId?: string | null;
  readonly leadId?: string | null;
  readonly title?: string;
  readonly description?: string | null;
  readonly value?: number;
  readonly currency?: string;
  readonly expectedCloseDate?: string | null;
  readonly ownerUserId?: string | null;
  readonly stage?: DealStage;
  readonly source?: LeadSource | null;
  readonly forecastCategory?: DealForecastCategory;
  readonly service?: string | null;
  readonly probability?: number | null;
  readonly priority?: DealPriority;
  readonly lossReason?: string | null;
  readonly competitor?: string | null;
  readonly lossNotes?: string | null;
}

export interface UpdateDealStagePayload {
  readonly stage: DealStage;
}

export interface WinDealPayload {
  readonly createProject?: boolean;
  readonly createInvoice?: boolean;
  readonly convertClient?: boolean;
  readonly templateId?: string | null;
  readonly projectName?: string | null;
  readonly projectId?: string | null;
  readonly quoteId?: string | null;
  readonly issueDate?: string | null;
  readonly dueDate?: string | null;
  readonly notes?: string | null;
}

export interface LoseDealPayload {
  readonly lossReason: string;
  readonly competitor?: string | null;
  readonly lossNotes?: string | null;
}

export interface CreateDealFromLeadPayload {
  readonly clientId?: string | null;
  readonly contactId?: string | null;
  readonly title?: string;
  readonly description?: string | null;
  readonly value?: number;
  readonly currency?: string;
  readonly expectedCloseDate?: string | null;
  readonly ownerUserId?: string | null;
  readonly stage?: DealStage;
  readonly service?: string | null;
  readonly probability?: number | null;
  readonly priority?: DealPriority;
  readonly forecastCategory?: DealForecastCategory;
}

export interface DealForecastResult {
  readonly period: DealForecastPeriod;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly pipelineValue: number;
  readonly weightedForecast: number;
  readonly expectedRevenue: number;
  readonly wonRevenue: number;
  readonly lostRevenue: number;
}

export interface DealDashboardResult {
  readonly openDeals: number;
  readonly wonThisMonth: number;
  readonly lostThisMonth: number;
  readonly pipelineValue: number;
  readonly weightedForecast: number;
  readonly averageDealSize: number;
  readonly winRate: number;
  readonly salesVelocityDays: number | null;
}

export interface ConvertDealToInvoicePayload {
  readonly projectId?: string;
  readonly quoteId?: string;
  readonly issueDate?: string;
  readonly dueDate?: string;
  readonly notes?: string;
}

export interface ConvertedInvoiceRecord {
  readonly id: string;
  readonly invoiceNumber: string;
  readonly status: string;
  readonly clientId: string;
  readonly projectId: string;
  readonly quoteId: string | null;
  readonly dealId: string;
  readonly issueDate: string;
  readonly dueDate: string | null;
  readonly currency: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
