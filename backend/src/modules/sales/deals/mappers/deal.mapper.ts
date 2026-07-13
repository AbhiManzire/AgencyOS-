import type { DealStage } from '@prisma/client';
import type {
  ConvertDealToInvoiceCommand,
  CreateDealCommand,
  CreateDealFromLeadCommand,
  GetDealForecastQuery,
  ListDealsQuery,
  LoseDealCommand,
  UpdateDealCommand,
  UpdateDealStageCommand,
  WinDealCommand,
} from '../services/deal-application.types';
import { ConvertDealToInvoiceDto } from '../dto/convert-deal-to-invoice.dto';
import { CreateDealFromLeadDto } from '../dto/create-deal-from-lead.dto';
import { CreateDealDto, type CreateDealStageInput } from '../dto/create-deal.dto';
import { GetDealForecastQueryDto } from '../dto/get-deal-forecast-query.dto';
import { ListDealsQueryDto } from '../dto/list-deals-query.dto';
import { LoseDealDto } from '../dto/lose-deal.dto';
import { UpdateDealStageDto } from '../dto/update-deal-stage.dto';
import { UpdateDealDto } from '../dto/update-deal.dto';
import { WinDealDto } from '../dto/win-deal.dto';

export const DealMapper = {
  toCreateDealCommand(dto: CreateDealDto): CreateDealCommand {
    return {
      clientId: dto.clientId,
      contactId: dto.contactId,
      leadId: dto.leadId,
      title: dto.title,
      description: dto.description,
      value: dto.value,
      currency: dto.currency,
      expectedCloseDate: dto.expectedCloseDate,
      ownerUserId: dto.ownerUserId,
      stage: mapStageAlias(dto.stage),
      source: dto.source,
      forecastCategory: dto.forecastCategory,
      service: dto.service,
      probability: dto.probability,
      priority: dto.priority,
    };
  },

  toUpdateDealCommand(dto: UpdateDealDto): UpdateDealCommand {
    return {
      clientId: dto.clientId,
      contactId: dto.contactId,
      leadId: dto.leadId,
      title: dto.title,
      description: dto.description,
      value: dto.value,
      currency: dto.currency,
      expectedCloseDate: dto.expectedCloseDate,
      ownerUserId: dto.ownerUserId,
      stage: mapStageAlias(dto.stage),
      source: dto.source,
      forecastCategory: dto.forecastCategory,
      service: dto.service,
      probability: dto.probability,
      priority: dto.priority,
      lossReason: dto.lossReason,
      competitor: dto.competitor,
      lossNotes: dto.lossNotes,
    };
  },

  toUpdateDealStageCommand(dto: UpdateDealStageDto): UpdateDealStageCommand {
    return { stage: dto.stage };
  },

  toWinDealCommand(dto: WinDealDto): WinDealCommand {
    return {
      createProject: dto.createProject,
      createInvoice: dto.createInvoice,
      convertClient: dto.convertClient,
      projectName: dto.projectName,
      projectId: dto.projectId,
      templateId: dto.templateId,
      quoteId: dto.quoteId,
      issueDate: dto.issueDate,
      dueDate: dto.dueDate,
      notes: dto.notes,
    };
  },

  toLoseDealCommand(dto: LoseDealDto): LoseDealCommand {
    return {
      lossReason: dto.lossReason,
      competitor: dto.competitor,
      lossNotes: dto.lossNotes,
    };
  },

  toCreateDealFromLeadCommand(dto: CreateDealFromLeadDto): CreateDealFromLeadCommand {
    return {
      clientId: dto.clientId,
      contactId: dto.contactId,
      title: dto.title,
      description: dto.description,
      value: dto.value,
      currency: dto.currency,
      expectedCloseDate: dto.expectedCloseDate,
      ownerUserId: dto.ownerUserId,
      stage: mapStageAlias(dto.stage),
      service: dto.service,
      probability: dto.probability,
      priority: dto.priority,
      forecastCategory: dto.forecastCategory,
    };
  },

  toListDealsQuery(dto: ListDealsQueryDto): ListDealsQuery {
    return {
      skip: dto.skip,
      take: dto.take,
      q: dto.q,
      stage: mapStageAlias(dto.stage),
      priority: dto.priority,
      ownerUserId: dto.ownerUserId,
      clientId: dto.clientId,
      leadId: dto.leadId,
      probabilityMin: dto.probabilityMin,
      probabilityMax: dto.probabilityMax,
      includeArchived: dto.includeArchived,
      sortBy: dto.sortBy,
      sortOrder: dto.sortOrder,
    };
  },

  toGetDealForecastQuery(dto: GetDealForecastQueryDto): GetDealForecastQuery {
    return {
      period: dto.period,
      asOf: dto.asOf,
    };
  },

  toConvertDealToInvoiceCommand(dto: ConvertDealToInvoiceDto): ConvertDealToInvoiceCommand {
    return {
      projectId: dto.projectId,
      quoteId: dto.quoteId,
      issueDate: dto.issueDate,
      dueDate: dto.dueDate,
      notes: dto.notes,
    };
  },
};

function mapStageAlias(stage: CreateDealStageInput | DealStage | undefined): DealStage | undefined {
  if (stage === undefined) {
    return undefined;
  }

  if (stage === 'NEW' || stage === 'CONTACTED' || stage === 'QUALIFIED') {
    return 'QUALIFICATION';
  }

  return stage;
}
