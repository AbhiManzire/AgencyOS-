import type { DealStage } from '@/features/sales/deals/types';

/** Deal row returned by GET /deals — mirrors backend DealRecord. */
export interface DealRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly clientId: string;
  readonly clientName: string;
  readonly contactId: string | null;
  readonly contactName: string | null;
  readonly title: string;
  readonly value: number;
  readonly currency: string;
  readonly expectedCloseDate: string | null;
  readonly ownerUserId: string | null;
  readonly ownerDisplayName: string | null;
  readonly ownerEmail: string | null;
  readonly stage: DealStage;
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
  readonly stage?: DealStage;
  readonly ownerUserId?: string;
  readonly clientId?: string;
  readonly includeArchived?: boolean;
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
  readonly title: string;
  readonly value: number;
  readonly currency?: string;
  readonly expectedCloseDate?: string | null;
  readonly ownerUserId?: string | null;
  readonly stage?: DealStage;
}

export interface UpdateDealPayload {
  readonly clientId?: string;
  readonly contactId?: string | null;
  readonly title?: string;
  readonly value?: number;
  readonly currency?: string;
  readonly expectedCloseDate?: string | null;
  readonly ownerUserId?: string | null;
  readonly stage?: DealStage;
}
