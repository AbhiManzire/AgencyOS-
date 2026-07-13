export const DEAL_LINE_ITEM_REPOSITORY = Symbol('DEAL_LINE_ITEM_REPOSITORY');

export interface DealLineItemScope {
  readonly tenantId: string;
  readonly workspaceId: string;
}

export interface DealLineItemDealScope extends DealLineItemScope {
  readonly dealId: string;
}

export interface DealLineItemRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly dealId: string;
  readonly name: string;
  readonly description: string | null;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly discount: number;
  readonly tax: number;
  readonly subtotal: number;
  readonly total: number;
  readonly sortOrder: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: Date | null;
  readonly deletedByUserId: string | null;
}

export interface CreateDealLineItemData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly dealId: string;
  readonly name: string;
  readonly description?: string | null;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly discount?: number;
  readonly tax?: number;
  readonly subtotal: number;
  readonly total: number;
  readonly sortOrder: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId?: string | null;
  readonly updatedByUserId?: string | null;
}

export interface UpdateDealLineItemData {
  readonly name?: string;
  readonly description?: string | null;
  readonly quantity?: number;
  readonly unitPrice?: number;
  readonly discount?: number;
  readonly tax?: number;
  readonly subtotal?: number;
  readonly total?: number;
  readonly sortOrder?: number;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface SoftDeleteDealLineItemData {
  readonly deletedAt: Date;
  readonly deletedByUserId?: string | null;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface DealLineItemRepository {
  create(data: CreateDealLineItemData): Promise<DealLineItemRecord>;
  update(
    scope: DealLineItemScope,
    id: string,
    data: UpdateDealLineItemData,
  ): Promise<DealLineItemRecord | null>;
  softDelete(
    scope: DealLineItemScope,
    id: string,
    data: SoftDeleteDealLineItemData,
  ): Promise<DealLineItemRecord | null>;
  findById(scope: DealLineItemScope, id: string): Promise<DealLineItemRecord | null>;
  listByDeal(scope: DealLineItemDealScope): Promise<readonly DealLineItemRecord[]>;
  getMaxSortOrder(scope: DealLineItemDealScope): Promise<number>;
}
