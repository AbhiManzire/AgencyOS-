import type {
  ListVendorsResult,
  VendorListSortField,
  VendorRecord,
  VendorScope,
} from '../repositories/vendor.repository.interface';

export interface VendorApplicationContext {
  readonly actorUserId: string;
}

export interface CreateVendorCommand {
  readonly name: string;
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

export interface UpdateVendorCommand {
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

export type RestoreVendorCommand = Record<string, never>;

export interface GetVendorOptions {
  readonly includeArchived?: boolean;
}

export interface ListVendorsQuery {
  readonly skip?: number;
  readonly take?: number;
  readonly q?: string;
  readonly includeArchived?: boolean;
  readonly sortBy?: VendorListSortField;
  readonly sortOrder?: 'asc' | 'desc';
}

export type { VendorRecord, VendorScope, ListVendorsResult };
