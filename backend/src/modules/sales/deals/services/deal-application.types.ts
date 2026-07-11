import type { DealPriority, DealStage } from '@prisma/client';
import type {
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
  readonly value: number;
  readonly currency?: string;
  readonly expectedCloseDate?: Date | null;
  readonly ownerUserId?: string | null;
  readonly stage?: DealStage;
  readonly service?: string | null;
  readonly probability?: number | null;
  readonly priority?: DealPriority;
}

export interface UpdateDealCommand {
  readonly clientId?: string;
  readonly contactId?: string | null;
  readonly leadId?: string | null;
  readonly title?: string;
  readonly value?: number;
  readonly currency?: string;
  readonly expectedCloseDate?: Date | null;
  readonly ownerUserId?: string | null;
  readonly stage?: DealStage;
  readonly service?: string | null;
  readonly probability?: number | null;
  readonly priority?: DealPriority;
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

export type { DealRecord, DealScope, ListDealsResult };
