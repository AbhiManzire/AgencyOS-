import type { DealStage } from '@prisma/client';

export const DEAL_REPOSITORY = Symbol('DEAL_REPOSITORY');

export interface DealScope {
  readonly tenantId: string;
  readonly workspaceId: string;
}

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
  readonly expectedCloseDate: Date | null;
  readonly ownerUserId: string | null;
  readonly ownerDisplayName: string | null;
  readonly ownerEmail: string | null;
  readonly stage: DealStage;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: Date | null;
  readonly deletedByUserId: string | null;
}

export interface CreateDealData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly clientId: string;
  readonly contactId?: string | null;
  readonly title: string;
  readonly value: number;
  readonly currency?: string;
  readonly expectedCloseDate?: Date | null;
  readonly ownerUserId?: string | null;
  readonly stage?: DealStage;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId?: string | null;
  readonly updatedByUserId?: string | null;
}

export interface UpdateDealData {
  readonly clientId?: string;
  readonly contactId?: string | null;
  readonly title?: string;
  readonly value?: number;
  readonly currency?: string;
  readonly expectedCloseDate?: Date | null;
  readonly ownerUserId?: string | null;
  readonly stage?: DealStage;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface FindDealByIdOptions {
  readonly includeArchived?: boolean;
}

export interface ListDealsParams {
  readonly scope: DealScope;
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
}

export interface DealRepository {
  create(data: CreateDealData): Promise<DealRecord>;
  update(scope: DealScope, id: string, data: UpdateDealData): Promise<DealRecord | null>;
  findById(scope: DealScope, id: string, options?: FindDealByIdOptions): Promise<DealRecord | null>;
  list(params: ListDealsParams): Promise<ListDealsResult>;
}
