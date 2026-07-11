import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  LEDGER_ENTRY_REPOSITORY,
  type CreateLedgerEntryData,
  type LedgerEntryRecord,
  type LedgerEntryRepository,
  type LedgerScope,
  type LedgerTransactionClient,
} from '../repositories/ledger-entry.repository.interface';
import type { LedgerApplicationContext } from './ledger-application.types';

export interface PostLedgerParams {
  readonly entryDate: Date;
  readonly entityType: string;
  readonly entityId: string;
  readonly clientId?: string | null;
  readonly vendorId?: string | null;
  readonly amount: number;
  readonly description?: string;
  readonly referenceType?: string;
  readonly referenceId?: string;
}

@Injectable()
export class LedgerPostingService {
  constructor(
    @Inject(LEDGER_ENTRY_REPOSITORY)
    private readonly ledgerEntryRepository: LedgerEntryRepository,
  ) {}

  async postInvoiceSent(
    scope: LedgerScope,
    params: PostLedgerParams,
    context: LedgerApplicationContext,
    tx?: LedgerTransactionClient,
  ): Promise<LedgerEntryRecord> {
    return this.post(
      scope,
      {
        ...params,
        accountType: 'RECEIVABLE',
        debit: params.amount,
        credit: 0,
      },
      context,
      tx,
    );
  }

  async postPaymentReceived(
    scope: LedgerScope,
    params: PostLedgerParams,
    context: LedgerApplicationContext,
    tx?: LedgerTransactionClient,
  ): Promise<LedgerEntryRecord> {
    return this.post(
      scope,
      {
        ...params,
        accountType: 'PAYMENT',
        debit: 0,
        credit: params.amount,
      },
      context,
      tx,
    );
  }

  async postExpense(
    scope: LedgerScope,
    params: PostLedgerParams,
    context: LedgerApplicationContext,
    tx?: LedgerTransactionClient,
  ): Promise<LedgerEntryRecord> {
    return this.post(
      scope,
      {
        ...params,
        accountType: 'VENDOR',
        debit: params.amount,
        credit: 0,
      },
      context,
      tx,
    );
  }

  async postBillPaid(
    scope: LedgerScope,
    params: PostLedgerParams,
    context: LedgerApplicationContext,
    tx?: LedgerTransactionClient,
  ): Promise<LedgerEntryRecord> {
    return this.post(
      scope,
      {
        ...params,
        accountType: 'PAYABLE',
        debit: params.amount,
        credit: 0,
      },
      context,
      tx,
    );
  }

  async postCreditNote(
    scope: LedgerScope,
    params: PostLedgerParams,
    context: LedgerApplicationContext,
    tx?: LedgerTransactionClient,
  ): Promise<LedgerEntryRecord> {
    return this.post(
      scope,
      {
        ...params,
        accountType: 'CLIENT',
        debit: 0,
        credit: params.amount,
      },
      context,
      tx,
    );
  }

  private async post(
    scope: LedgerScope,
    params: PostLedgerParams & {
      accountType: CreateLedgerEntryData['accountType'];
      debit: number;
      credit: number;
    },
    context: LedgerApplicationContext,
    tx?: LedgerTransactionClient,
  ): Promise<LedgerEntryRecord> {
    const data: CreateLedgerEntryData = {
      id: randomUUID(),
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      entryDate: params.entryDate,
      accountType: params.accountType,
      entityType: params.entityType,
      entityId: params.entityId,
      clientId: params.clientId ?? null,
      vendorId: params.vendorId ?? null,
      debit: params.debit,
      credit: params.credit,
      description: params.description ?? null,
      referenceType: params.referenceType ?? null,
      referenceId: params.referenceId ?? null,
      createdAt: new Date(),
      createdByUserId: context.actorUserId,
    };
    return this.ledgerEntryRepository.create(data, tx);
  }
}
