export interface DealLineItemApplicationContext {
  readonly actorUserId: string;
}

export interface CreateDealLineItemCommand {
  readonly name: string;
  readonly description?: string | null;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly discount?: number;
  readonly tax?: number;
  readonly sortOrder?: number;
}

export interface UpdateDealLineItemCommand {
  readonly name?: string;
  readonly description?: string | null;
  readonly quantity?: number;
  readonly unitPrice?: number;
  readonly discount?: number;
  readonly tax?: number;
  readonly sortOrder?: number;
}

export type { DealLineItemScope } from '../repositories/deal-line-item.repository.interface';
