import type {
  CreateCampaignCommand,
  ListCampaignsQuery,
  RestoreCampaignCommand,
  UpdateCampaignCommand,
} from '../services/campaign-application.types';
import { CreateCampaignDto } from '../dto/create-campaign.dto';
import { ListCampaignsQueryDto } from '../dto/list-campaigns-query.dto';
import { RestoreCampaignDto } from '../dto/restore-campaign.dto';
import { UpdateCampaignDto } from '../dto/update-campaign.dto';

/** Maps HTTP DTOs to application commands and queries — no business logic. */
export const CampaignMapper = {
  toCreateCampaignCommand(dto: CreateCampaignDto): CreateCampaignCommand {
    return {
      name: dto.name,
      code: dto.code,
      description: dto.description,
      status: dto.status,
      startsAt: dto.startsAt,
      endsAt: dto.endsAt,
    };
  },

  toUpdateCampaignCommand(dto: UpdateCampaignDto): UpdateCampaignCommand {
    return {
      name: dto.name,
      code: dto.code,
      description: dto.description,
      status: dto.status,
      startsAt: dto.startsAt,
      endsAt: dto.endsAt,
    };
  },

  toRestoreCampaignCommand(dto: RestoreCampaignDto): RestoreCampaignCommand {
    return {
      targetStatus: dto.targetStatus,
    };
  },

  toListCampaignsQuery(dto: ListCampaignsQueryDto): ListCampaignsQuery {
    return {
      skip: dto.skip,
      take: dto.take,
      q: dto.q,
      status: dto.status,
      includeArchived: dto.includeArchived,
    };
  },
};
