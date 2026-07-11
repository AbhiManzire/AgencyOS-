import type { Prisma } from '@prisma/client';

export const VENDOR_REPOSITORY = Symbol('VENDOR_REPOSITORY');

export interface VendorScope {
  readonly tenantId: string;
  readonly workspaceId: string;
}

export type VendorTransactionClient = Prisma.TransactionClient;

export type VendorListSortField = 'updatedAt' | 'createdAt' | 'name';

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
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: Date | null;
  readonly deletedByUserId: string | null;
}

export interface CreateVendorData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly name: string;
  readonly code?: string | null;
  readonly gstin?: string | null;
  readonly pan?: string | null;
  readonly email?: string | null;
  readonly phone?: string | null;
  readonly contactPerson?: string | null;
  readonly paymentTermsDays?: number | null;
  readonly currency: string;
  readonly notes?: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId?: string | null;
  readonly updatedByUserId?: string | null;
}

export interface UpdateVendorData {
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
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface ArchiveVendorData {
  readonly deletedAt: Date;
  readonly deletedByUserId: string | null;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface RestoreVendorData {
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface FindVendorByIdOptions {
  readonly includeArchived?: boolean;
}

export interface ListVendorsParams {
  readonly scope: VendorScope;
  readonly skip?: number;
  readonly take?: number;
  readonly q?: string;
  readonly includeArchived?: boolean;
  readonly sortBy?: VendorListSortField;
  readonly sortOrder?: 'asc' | 'desc';
}

export interface ListVendorsResult {
  readonly items: readonly VendorRecord[];
  readonly total: number;
}

export interface VendorRepository {
  create(data: CreateVendorData, tx?: VendorTransactionClient): Promise<VendorRecord>;
  update(
    scope: VendorScope,
    id: string,
    data: UpdateVendorData,
    tx?: VendorTransactionClient,
  ): Promise<VendorRecord | null>;
  archive(
    scope: VendorScope,
    id: string,
    data: ArchiveVendorData,
    tx?: VendorTransactionClient,
  ): Promise<VendorRecord | null>;
  restore(
    scope: VendorScope,
    id: string,
    data: RestoreVendorData,
    tx?: VendorTransactionClient,
  ): Promise<VendorRecord | null>;
  findById(
    scope: VendorScope,
    id: string,
    options?: FindVendorByIdOptions,
  ): Promise<VendorRecord | null>;
  list(params: ListVendorsParams): Promise<ListVendorsResult>;
}
