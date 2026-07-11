import type {
  CreateProposalCommand,
  ListProposalsQuery,
  UpdateProposalCommand,
} from '../services/proposal-application.types';
import { CreateProposalDto } from '../dto/create-proposal.dto';
import { ListProposalsQueryDto } from '../dto/list-proposals-query.dto';
import { UpdateProposalDto } from '../dto/update-proposal.dto';

export const ProposalMapper = {
  toCreateProposalCommand(dto: CreateProposalDto): CreateProposalCommand {
    return {
      dealId: dto.dealId,
      quoteId: dto.quoteId,
      title: dto.title,
      status: dto.status,
      sections: dto.sections,
      amount: dto.amount,
      tax: dto.tax,
      discount: dto.discount,
      validUntil: dto.validUntil,
    };
  },

  toUpdateProposalCommand(dto: UpdateProposalDto): UpdateProposalCommand {
    return {
      quoteId: dto.quoteId,
      title: dto.title,
      status: dto.status,
      sections: dto.sections,
      incrementVersion: dto.incrementVersion,
      amount: dto.amount,
      tax: dto.tax,
      discount: dto.discount,
      validUntil: dto.validUntil,
    };
  },

  toListProposalsQuery(dto: ListProposalsQueryDto): ListProposalsQuery {
    return {
      skip: dto.skip,
      take: dto.take,
      dealId: dto.dealId,
      status: dto.status,
    };
  },
};
