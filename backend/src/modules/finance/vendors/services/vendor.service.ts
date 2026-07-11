import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { VendorDomainService } from '../domain/vendor-domain.service';
import { VENDOR_DOMAIN_ERROR_CODES, VendorDomainError } from '../domain/vendor-domain.errors';
import {
  VENDOR_REPOSITORY,
  type CreateVendorData,
  type FindVendorByIdOptions,
  type UpdateVendorData,
  type VendorRepository,
  type VendorTransactionClient,
} from '../repositories/vendor.repository.interface';
import type {
  CreateVendorCommand,
  GetVendorOptions,
  ListVendorsQuery,
  ListVendorsResult,
  RestoreVendorCommand,
  UpdateVendorCommand,
  VendorApplicationContext,
  VendorRecord,
  VendorScope,
} from './vendor-application.types';

@Injectable()
export class VendorService {
  constructor(
    @Inject(VENDOR_REPOSITORY)
    private readonly vendorRepository: VendorRepository,
    private readonly vendorDomainService: VendorDomainService,
    private readonly prisma: PrismaService,
  ) {}

  async createVendor(
    scope: VendorScope,
    command: CreateVendorCommand,
    context: VendorApplicationContext,
  ): Promise<VendorRecord> {
    this.vendorDomainService.validateCreate({
      name: command.name,
      currency: command.currency,
      paymentTermsDays: command.paymentTermsDays,
    });

    const now = new Date();
    const data: CreateVendorData = {
      id: randomUUID(),
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      name: this.vendorDomainService.normalizeRequiredString(command.name),
      code: this.vendorDomainService.normalizeOptionalString(command.code),
      gstin: this.vendorDomainService.normalizeOptionalString(command.gstin),
      pan: this.vendorDomainService.normalizeOptionalString(command.pan),
      email: this.vendorDomainService.normalizeOptionalEmail(command.email),
      phone: this.vendorDomainService.normalizeOptionalString(command.phone),
      contactPerson: this.vendorDomainService.normalizeOptionalString(command.contactPerson),
      paymentTermsDays: command.paymentTermsDays ?? null,
      currency: this.vendorDomainService.normalizeCurrency(command.currency),
      notes: this.vendorDomainService.normalizeOptionalString(command.notes),
      createdAt: now,
      updatedAt: now,
      createdByUserId: context.actorUserId,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(async (tx) => this.vendorRepository.create(data, tx));
  }

  async updateVendor(
    scope: VendorScope,
    vendorId: string,
    command: UpdateVendorCommand,
    context: VendorApplicationContext,
  ): Promise<VendorRecord> {
    const existing = await this.requireVendor(scope, vendorId, { includeArchived: true });
    this.vendorDomainService.validateUpdate(existing, {
      name: command.name,
      currency: command.currency,
      paymentTermsDays: command.paymentTermsDays,
    });

    const now = new Date();
    const data: UpdateVendorData = {
      ...(command.name !== undefined
        ? { name: this.vendorDomainService.normalizeRequiredString(command.name) }
        : {}),
      ...(command.code !== undefined
        ? { code: this.vendorDomainService.normalizeOptionalString(command.code) }
        : {}),
      ...(command.gstin !== undefined
        ? { gstin: this.vendorDomainService.normalizeOptionalString(command.gstin) }
        : {}),
      ...(command.pan !== undefined
        ? { pan: this.vendorDomainService.normalizeOptionalString(command.pan) }
        : {}),
      ...(command.email !== undefined
        ? { email: this.vendorDomainService.normalizeOptionalEmail(command.email) }
        : {}),
      ...(command.phone !== undefined
        ? { phone: this.vendorDomainService.normalizeOptionalString(command.phone) }
        : {}),
      ...(command.contactPerson !== undefined
        ? {
            contactPerson: this.vendorDomainService.normalizeOptionalString(command.contactPerson),
          }
        : {}),
      ...(command.paymentTermsDays !== undefined
        ? { paymentTermsDays: command.paymentTermsDays }
        : {}),
      ...(command.currency !== undefined
        ? { currency: this.vendorDomainService.normalizeCurrency(command.currency) }
        : {}),
      ...(command.notes !== undefined
        ? { notes: this.vendorDomainService.normalizeOptionalString(command.notes) }
        : {}),
      updatedAt: now,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(async (tx) => {
      const updated = await this.vendorRepository.update(scope, vendorId, data, tx);
      if (updated === null) {
        throw new VendorDomainError(
          VENDOR_DOMAIN_ERROR_CODES.VENDOR_NOT_FOUND,
          'Vendor was not found.',
        );
      }
      return updated;
    });
  }

  async archiveVendor(
    scope: VendorScope,
    vendorId: string,
    context: VendorApplicationContext,
  ): Promise<VendorRecord> {
    const existing = await this.requireVendor(scope, vendorId);
    this.vendorDomainService.validateArchive(existing);
    const now = new Date();

    return this.runInTransaction(async (tx) => {
      const archived = await this.vendorRepository.archive(
        scope,
        vendorId,
        {
          deletedAt: now,
          deletedByUserId: context.actorUserId,
          updatedAt: now,
          updatedByUserId: context.actorUserId,
        },
        tx,
      );
      if (archived === null) {
        throw new VendorDomainError(
          VENDOR_DOMAIN_ERROR_CODES.VENDOR_NOT_FOUND,
          'Vendor was not found.',
        );
      }
      return archived;
    });
  }

  async restoreVendor(
    scope: VendorScope,
    vendorId: string,
    _command: RestoreVendorCommand,
    context: VendorApplicationContext,
  ): Promise<VendorRecord> {
    const existing = await this.vendorRepository.findById(scope, vendorId, {
      includeArchived: true,
    });
    if (existing === null) {
      throw new VendorDomainError(
        VENDOR_DOMAIN_ERROR_CODES.VENDOR_NOT_FOUND,
        'Vendor was not found.',
      );
    }
    this.vendorDomainService.validateRestore(existing);
    const now = new Date();

    return this.runInTransaction(async (tx) => {
      const restored = await this.vendorRepository.restore(
        scope,
        vendorId,
        { updatedAt: now, updatedByUserId: context.actorUserId },
        tx,
      );
      if (restored === null) {
        throw new VendorDomainError(
          VENDOR_DOMAIN_ERROR_CODES.VENDOR_NOT_FOUND,
          'Vendor was not found.',
        );
      }
      return restored;
    });
  }

  async getVendor(
    scope: VendorScope,
    vendorId: string,
    options: GetVendorOptions = {},
  ): Promise<VendorRecord> {
    const vendor = await this.vendorRepository.findById(scope, vendorId, {
      includeArchived: options.includeArchived,
    });
    if (vendor === null) {
      throw new VendorDomainError(
        VENDOR_DOMAIN_ERROR_CODES.VENDOR_NOT_FOUND,
        'Vendor was not found.',
      );
    }
    this.vendorDomainService.ensureWorkspaceOwnership(scope, vendor);
    return vendor;
  }

  async listVendors(scope: VendorScope, query: ListVendorsQuery = {}): Promise<ListVendorsResult> {
    return this.vendorRepository.list({
      scope,
      skip: query.skip,
      take: query.take,
      q: query.q,
      includeArchived: query.includeArchived,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }

  private async runInTransaction<T>(work: (tx: VendorTransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => work(tx));
  }

  private async requireVendor(
    scope: VendorScope,
    vendorId: string,
    options?: FindVendorByIdOptions,
  ): Promise<VendorRecord> {
    const vendor = await this.vendorRepository.findById(scope, vendorId, options);
    if (vendor === null) {
      throw new VendorDomainError(
        VENDOR_DOMAIN_ERROR_CODES.VENDOR_NOT_FOUND,
        'Vendor was not found.',
      );
    }
    return vendor;
  }
}
