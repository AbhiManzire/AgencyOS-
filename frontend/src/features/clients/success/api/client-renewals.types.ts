export type ClientRenewalType =
  'HOSTING' | 'SEO' | 'AMC' | 'MAINTENANCE' | 'RETAINER' | 'DOMAIN' | 'SUBSCRIPTION';

export type ClientRenewalStatus =
  'ACTIVE' | 'UPCOMING' | 'OVERDUE' | 'RENEWED' | 'CANCELLED' | 'EXPIRED';

export const CLIENT_RENEWAL_TYPES: readonly ClientRenewalType[] = [
  'HOSTING',
  'SEO',
  'AMC',
  'MAINTENANCE',
  'RETAINER',
  'DOMAIN',
  'SUBSCRIPTION',
] as const;

export const CLIENT_RENEWAL_STATUSES: readonly ClientRenewalStatus[] = [
  'ACTIVE',
  'UPCOMING',
  'OVERDUE',
  'RENEWED',
  'CANCELLED',
  'EXPIRED',
] as const;

export const CLIENT_RENEWAL_TYPE_LABELS: Record<ClientRenewalType, string> = {
  HOSTING: 'Hosting',
  SEO: 'SEO',
  AMC: 'AMC',
  MAINTENANCE: 'Maintenance',
  RETAINER: 'Retainer',
  DOMAIN: 'Domain',
  SUBSCRIPTION: 'Subscription',
};

export const CLIENT_RENEWAL_STATUS_LABELS: Record<ClientRenewalStatus, string> = {
  ACTIVE: 'Active',
  UPCOMING: 'Upcoming',
  OVERDUE: 'Overdue',
  RENEWED: 'Renewed',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
};

export interface ClientRenewalRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly clientId: string;
  readonly type: ClientRenewalType;
  readonly title: string;
  readonly description: string | null;
  readonly amount: number | null;
  readonly currency: string | null;
  readonly renewalDate: string;
  readonly reminderDate: string | null;
  readonly autoNotify: boolean;
  readonly status: ClientRenewalStatus;
  readonly reminderId: string | null;
  readonly lastNotifiedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: string | null;
  readonly deletedByUserId: string | null;
}

export interface ListClientRenewalsParams {
  readonly skip?: number;
  readonly take?: number;
  readonly status?: ClientRenewalStatus;
}

export interface ListClientRenewalsResult {
  readonly items: readonly ClientRenewalRecord[];
  readonly total: number;
  readonly skip: number;
  readonly take: number;
}

export interface CreateClientRenewalPayload {
  readonly type: ClientRenewalType;
  readonly title: string;
  readonly description?: string;
  readonly amount?: number;
  readonly currency?: string;
  readonly renewalDate: string;
  readonly reminderDate?: string;
  readonly autoNotify?: boolean;
  readonly status?: ClientRenewalStatus;
}

export interface UpdateClientRenewalPayload {
  readonly type?: ClientRenewalType;
  readonly title?: string;
  readonly description?: string | null;
  readonly amount?: number | null;
  readonly currency?: string | null;
  readonly renewalDate?: string;
  readonly reminderDate?: string | null;
  readonly autoNotify?: boolean;
  readonly status?: ClientRenewalStatus;
}

export interface ClientRenewalFormValues {
  type: ClientRenewalType;
  title: string;
  description: string;
  amount: string;
  currency: string;
  renewalDate: string;
  reminderDate: string;
  autoNotify: boolean;
  status: ClientRenewalStatus;
}
