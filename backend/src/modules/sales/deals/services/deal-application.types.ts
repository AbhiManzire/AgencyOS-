import type { DealStage } from '@prisma/client';
import type {
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
  readonly title: string;
  readonly value: number;
  readonly currency?: string;
  readonly expectedCloseDate?: Date | null;
  readonly ownerUserId?: string | null;
  readonly stage?: DealStage;
}

export interface UpdateDealCommand {
  readonly clientId?: string;
  readonly contactId?: string | null;
  readonly title?: string;
  readonly value?: number;
  readonly currency?: string;
  readonly expectedCloseDate?: Date | null;
  readonly ownerUserId?: string | null;
  readonly stage?: DealStage;
}

export interface GetDealOptions {
  readonly includeArchived?: boolean;
}

export interface ListDealsQuery {
  readonly skip?: number;
  readonly take?: number;
  readonly stage?: DealStage;
  readonly ownerUserId?: string;
  readonly clientId?: string;
  readonly includeArchived?: boolean;
}

export type { DealRecord, DealScope, ListDealsResult };
