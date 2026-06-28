export type ClientStatus = 'PROSPECT' | 'ACTIVE' | 'INACTIVE';

export type ClientSource = 'REFERRAL' | 'INBOUND' | 'OUTBOUND' | 'IMPORT' | 'SALES_CONVERSION';

export type ClientSortField =
  'displayName' | 'company' | 'status' | 'owner' | 'email' | 'createdAt';

export type SortDirection = 'asc' | 'desc';

export type ClientListStatusFilter = 'all' | ClientStatus | 'archived';

export interface ClientListItem {
  readonly id: string;
  readonly displayName: string;
  readonly company: string;
  readonly status: ClientStatus;
  readonly owner: string;
  readonly email: string;
  readonly phone: string;
  readonly createdAt: string;
  readonly isArchived: boolean;
}
