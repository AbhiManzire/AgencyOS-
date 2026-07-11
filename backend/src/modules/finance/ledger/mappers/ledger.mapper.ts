import { ListLedgerQueryDto } from '../dto/list-ledger-query.dto';
import type { ListLedgerQuery } from '../services/ledger-application.types';

/** Maps HTTP DTOs to application queries — no business logic. */
export const LedgerMapper = {
  toListQuery(dto: ListLedgerQueryDto): ListLedgerQuery {
    return {
      skip: dto.skip,
      take: dto.take,
      clientId: dto.clientId,
      vendorId: dto.vendorId,
      accountType: dto.accountType,
    };
  },
};
