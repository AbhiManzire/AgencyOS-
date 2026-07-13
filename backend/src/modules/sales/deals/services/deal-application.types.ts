import type { DealForecastCategory, DealPriority, DealStage, LeadSource } from '@prisma/client';
import type {
  DealDashboardAggregate,
  DealForecastAggregate,
  DealListSortField,
  DealRecord,
  DealScope,
  ListDealsResult,
} from '../repositories/deal.repository.interface';

export interface DealApplicationContext {
  readonly actorUserId: string;
}

export interface CreateDealCommand {
  readonly clientId: string;
  readonly contactId?: string | null;
  readonly leadId?: string | null;
  readonly title: string;
  readonly description?: string | null;
  readonly value: number;
  readonly currency?: string;
  readonly expectedCloseDate?: Date | null;
  readonly ownerUserId?: string | null;
  readonly stage?: DealStage;
  readonly source?: LeadSource | null;
  readonly forecastCategory?: DealForecastCategory;
  readonly service?: string | null;
  readonly probability?: number | null;
  readonly priority?: DealPriority;
}

export interface UpdateDealCommand {
  readonly clientId?: string;
  readonly contactId?: string | null;
  readonly leadId?: string | null;
  readonly title?: string;
  readonly description?: string | null;
  readonly value?: number;
  readonly currency?: string;
  readonly expectedCloseDate?: Date | null;
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

export interface UpdateDealStageCommand {
  readonly stage: DealStage;
}

export interface WinDealCommand {
  readonly createProject?: boolean;
  readonly createInvoice?: boolean;
  readonly convertClient?: boolean;
  readonly projectName?: string | null;
  readonly projectId?: string | null;
  readonly templateId?: string | null;
  readonly quoteId?: string | null;
  readonly issueDate?: Date | null;
  readonly dueDate?: Date | null;
  readonly notes?: string | null;
}

export interface LoseDealCommand {
  readonly lossReason: string;
  readonly competitor?: string | null;
  readonly lossNotes?: string | null;
}

export interface CreateDealFromLeadCommand {
  readonly clientId?: string | null;
  readonly contactId?: string | null;
  readonly title?: string;
  readonly description?: string | null;
  readonly value?: number;
  readonly currency?: string;
  readonly expectedCloseDate?: Date | null;
  readonly ownerUserId?: string | null;
  readonly stage?: DealStage;
  readonly service?: string | null;
  readonly probability?: number | null;
  readonly priority?: DealPriority;
  readonly forecastCategory?: DealForecastCategory;
}

export interface ConvertDealToInvoiceCommand {
  readonly projectId?: string | null;
  readonly quoteId?: string | null;
  readonly issueDate?: Date | null;
  readonly dueDate?: Date | null;
  readonly notes?: string | null;
}

export interface ConvertedInvoiceRecord {
  readonly id: string;
  readonly invoiceNumber: string;
  readonly status: string;
  readonly clientId: string;
  readonly projectId: string;
  readonly quoteId: string | null;
  readonly dealId: string | null;
  readonly issueDate: Date;
  readonly dueDate: Date;
  readonly currency: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface GetDealOptions {
  readonly includeArchived?: boolean;
}

export interface ListDealsQuery {
  readonly skip?: number;
  readonly take?: number;
  readonly q?: string;
  readonly stage?: DealStage;
  readonly status?: import('@prisma/client').DealStatus;
  readonly priority?: DealPriority;
  readonly ownerUserId?: string;
  readonly clientId?: string;
  readonly leadId?: string;
  readonly probabilityMin?: number;
  readonly probabilityMax?: number;
  readonly includeArchived?: boolean;
  readonly sortBy?: DealListSortField;
  readonly sortOrder?: 'asc' | 'desc';
}

export type DealForecastPeriod = 'week' | 'month' | 'quarter' | 'year';

export interface GetDealForecastQuery {
  readonly period: DealForecastPeriod;
  readonly asOf?: Date;
}

export type DealForecastResult = DealForecastAggregate & {
  readonly period: DealForecastPeriod;
  readonly periodStart: string;
  readonly periodEnd: string;
};

export type DealDashboardResult = DealDashboardAggregate;

export type { DealRecord, DealScope, ListDealsResult };
