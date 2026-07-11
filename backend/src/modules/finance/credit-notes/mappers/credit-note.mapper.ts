import {
  ApplyCreditNoteDto,
  CreateCreditNoteDto,
  ListCreditNotesQueryDto,
} from '../dto/create-credit-note.dto';
import type {
  ApplyCreditNoteCommand,
  CreateCreditNoteCommand,
  ListCreditNotesQuery,
} from '../services/credit-note-application.types';

/** Maps HTTP DTOs to application commands and queries — no business logic. */
export const CreditNoteMapper = {
  toCreateCommand(dto: CreateCreditNoteDto): CreateCreditNoteCommand {
    return {
      clientId: dto.clientId,
      invoiceId: dto.invoiceId,
      creditNoteNumber: dto.creditNoteNumber,
      issueDate: dto.issueDate,
      amount: dto.amount,
      taxAmount: dto.taxAmount,
      currency: dto.currency,
      status: dto.status,
      notes: dto.notes,
    };
  },

  toApplyCommand(dto: ApplyCreditNoteDto): ApplyCreditNoteCommand {
    return {
      invoiceId: dto.invoiceId,
      amount: dto.amount,
    };
  },

  toListQuery(dto: ListCreditNotesQueryDto): ListCreditNotesQuery {
    return {
      skip: dto.skip,
      take: dto.take,
      clientId: dto.clientId,
      invoiceId: dto.invoiceId,
      status: dto.status,
      includeArchived: dto.includeArchived,
    };
  },
};
