export type ClientStatus = 'PROSPECT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export type ClientSource = 'REFERRAL' | 'INBOUND' | 'OUTBOUND' | 'IMPORT' | 'SALES_CONVERSION';

export type ClientSortField =
  'displayName' | 'company' | 'status' | 'owner' | 'email' | 'createdAt';

/** Server-supported sort fields for GET /clients. */
export type ClientServerSortField = 'createdAt' | 'displayName' | 'status' | 'email' | 'legalName';

export type SortDirection = 'asc' | 'desc';

export type ClientListStatusFilter = 'all' | Exclude<ClientStatus, 'ARCHIVED'> | 'archived';

export interface ClientListItem {
  readonly id: string;
  readonly displayName: string;
  readonly clientCode: string;
  readonly company: string;
  readonly status: ClientStatus;
  readonly owner: string;
  readonly email: string;
  readonly phone: string;
  readonly createdAt: string;
  readonly isArchived: boolean;
}

export interface WorkspaceOwnerOption {
  readonly id: string;
  readonly displayName: string;
  readonly email: string;
}
