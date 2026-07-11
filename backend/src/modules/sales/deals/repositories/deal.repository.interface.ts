import type { DealPriority, DealStage, Prisma } from '@prisma/client';

export const DEAL_REPOSITORY = Symbol('DEAL_REPOSITORY');

export type DealTransactionClient = Prisma.TransactionClient;

export type DealListSortField =
  'updatedAt' | 'createdAt' | 'value' | 'probability' | 'expectedCloseDate' | 'title';

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
  readonly leadId: string | null;
  readonly title: string;
  readonly value: number;
  readonly currency: string;
  readonly expectedCloseDate: Date | null;
  readonly ownerUserId: string | null;
  readonly ownerDisplayName: string | null;
  readonly ownerEmail: string | null;
  readonly stage: DealStage;
  readonly service: string | null;
  readonly probability: number | null;
  readonly priority: DealPriority;
  readonly stageEnteredAt: Date | null;
  readonly convertedProjectId: string | null;
  readonly wonAt: Date | null;
  readonly lostAt: Date | null;
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
  readonly stageEnteredAt?: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId?: string | null;
  readonly updatedByUserId?: string | null;
}

export interface UpdateDealData {
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
  readonly stageEnteredAt?: Date | null;
  readonly convertedProjectId?: string | null;
  readonly wonAt?: Date | null;
  readonly lostAt?: Date | null;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface ArchiveDealData {
  readonly deletedAt: Date;
  readonly deletedByUserId: string | null;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface RestoreDealData {
  readonly stage: DealStage;
  readonly stageEnteredAt: Date;
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

export interface ListDealsResult {
  readonly items: readonly DealRecord[];
  readonly total: number;
}

export interface CreateDealStageHistoryData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly dealId: string;
  readonly fromStage: DealStage;
  readonly toStage: DealStage;
  readonly enteredAt: Date;
  readonly changedByUserId?: string | null;
}

export interface DealRepository {
  create(data: CreateDealData, tx?: DealTransactionClient): Promise<DealRecord>;
  update(
    scope: DealScope,
    id: string,
    data: UpdateDealData,
    tx?: DealTransactionClient,
  ): Promise<DealRecord | null>;
  archive(
    scope: DealScope,
    id: string,
    data: ArchiveDealData,
    tx?: DealTransactionClient,
  ): Promise<DealRecord | null>;
  restore(
    scope: DealScope,
    id: string,
    data: RestoreDealData,
    tx?: DealTransactionClient,
  ): Promise<DealRecord | null>;
  findById(scope: DealScope, id: string, options?: FindDealByIdOptions): Promise<DealRecord | null>;
  list(params: ListDealsParams): Promise<ListDealsResult>;
  createStageHistory(data: CreateDealStageHistoryData, tx?: DealTransactionClient): Promise<void>;
  closeOpenStageHistory(
    scope: DealScope,
    dealId: string,
    exitedAt: Date,
    tx?: DealTransactionClient,
  ): Promise<void>;
}
