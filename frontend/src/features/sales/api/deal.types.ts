import type { DealPriority, DealStage } from '@/features/sales/types';

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
  readonly title: string;
  readonly value: number;
  readonly currency: string;
  readonly expectedCloseDate: string | null;
  readonly ownerUserId: string | null;
  readonly ownerDisplayName: string | null;
  readonly ownerEmail: string | null;
  readonly stage: DealStage;
  readonly service: string | null;
  readonly probability: number | null;
  readonly priority: DealPriority;
  readonly stageEnteredAt: string | null;
  readonly convertedProjectId: string | null;
  readonly wonAt: string | null;
  readonly lostAt: string | null;
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
  readonly value: number;
  readonly currency?: string;
  readonly expectedCloseDate?: string | null;
  readonly ownerUserId?: string | null;
  readonly stage?: DealStage;
  readonly service?: string | null;
  readonly probability?: number | null;
  readonly priority?: DealPriority;
}

export interface UpdateDealPayload {
  readonly clientId?: string;
  readonly contactId?: string | null;
  readonly leadId?: string | null;
  readonly title?: string;
  readonly value?: number;
  readonly currency?: string;
  readonly expectedCloseDate?: string | null;
  readonly ownerUserId?: string | null;
  readonly stage?: DealStage;
  readonly service?: string | null;
  readonly probability?: number | null;
  readonly priority?: DealPriority;
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
