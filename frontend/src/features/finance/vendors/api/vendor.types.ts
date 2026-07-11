export type VendorSortField = 'updatedAt' | 'createdAt' | 'name';
export type SortDirection = 'asc' | 'desc';

/** Vendor row returned by GET /vendors — mirrors backend VendorRecord. */
export interface VendorRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly name: string;
  readonly code: string | null;
  readonly gstin: string | null;
  readonly pan: string | null;
  readonly email: string | null;
  readonly phone: string | null;
  readonly contactPerson: string | null;
  readonly paymentTermsDays: number | null;
  readonly currency: string;
  readonly notes: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: string | null;
  readonly deletedByUserId: string | null;
}

export interface ListVendorsParams {
  readonly skip?: number;
  readonly take?: number;
  readonly q?: string;
  readonly includeArchived?: boolean;
  readonly sortBy?: VendorSortField;
  readonly sortOrder?: SortDirection;
}

export interface ListVendorsResult {
  readonly items: readonly VendorRecord[];
  readonly total: number;
  readonly skip: number;
  readonly take: number;
}

export interface CreateVendorPayload {
  readonly name: string;
  readonly code?: string;
  readonly gstin?: string;
  readonly pan?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly contactPerson?: string;
  readonly paymentTermsDays?: number | null;
  readonly currency?: string;
  readonly notes?: string;
}

export interface UpdateVendorPayload {
  readonly name?: string;
  readonly code?: string | null;
  readonly gstin?: string | null;
  readonly pan?: string | null;
  readonly email?: string | null;
  readonly phone?: string | null;
  readonly contactPerson?: string | null;
  readonly paymentTermsDays?: number | null;
  readonly currency?: string;
  readonly notes?: string | null;
}

export interface RestoreVendorPayload {
  readonly unused?: never;
}
