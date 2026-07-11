import { Inject, Injectable } from '@nestjs/common';
import {
  LEDGER_ENTRY_REPOSITORY,
  type LedgerEntryRepository,
} from '../repositories/ledger-entry.repository.interface';
import type {
  LedgerScope,
  ListLedgerEntriesResult,
  ListLedgerQuery,
} from './ledger-application.types';

@Injectable()
export class LedgerService {
  constructor(
    @Inject(LEDGER_ENTRY_REPOSITORY)
    private readonly ledgerEntryRepository: LedgerEntryRepository,
  ) {}

  async listEntries(
    scope: LedgerScope,
    query: ListLedgerQuery = {},
  ): Promise<ListLedgerEntriesResult> {
    return this.ledgerEntryRepository.list({
      scope,
      skip: query.skip,
      take: query.take,
      clientId: query.clientId,
      vendorId: query.vendorId,
      accountType: query.accountType,
    });
  }
}
