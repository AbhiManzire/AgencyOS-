import type {
  CreateProposalCommand,
  UpdateProposalCommand,
} from '../services/proposal-application.types';
import { CreateProposalDto } from '../dto/create-proposal.dto';
import { UpdateProposalDto } from '../dto/update-proposal.dto';

export const ProposalMapper = {
  toCreateProposalCommand(dto: CreateProposalDto): CreateProposalCommand {
    return {
      dealId: dto.dealId,
      quoteId: dto.quoteId,
      title: dto.title,
      status: dto.status,
      sections: dto.sections,
    };
  },

  toUpdateProposalCommand(dto: UpdateProposalDto): UpdateProposalCommand {
    return {
      quoteId: dto.quoteId,
      title: dto.title,
      status: dto.status,
      sections: dto.sections,
      incrementVersion: dto.incrementVersion,
    };
  },
};
