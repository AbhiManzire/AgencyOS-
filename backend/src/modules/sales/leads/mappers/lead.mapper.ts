import type {
  CreateLeadCommand,
  ListLeadsQuery,
  RestoreLeadCommand,
  UpdateLeadCommand,
} from '../services/lead-application.types';
import { CreateLeadDto } from '../dto/create-lead.dto';
import { ListLeadsQueryDto } from '../dto/list-leads-query.dto';
import { RestoreLeadDto } from '../dto/restore-lead.dto';
import { UpdateLeadDto } from '../dto/update-lead.dto';

/** Maps HTTP DTOs to application commands and queries — no business logic. */
export const LeadMapper = {
  toCreateLeadCommand(dto: CreateLeadDto): CreateLeadCommand {
    return {
      code: dto.code,
      company: dto.company,
      contactPerson: dto.contactPerson,
      email: dto.email,
      phone: dto.phone,
      whatsapp: dto.whatsapp,
      website: dto.website,
      industry: dto.industry,
      country: dto.country,
      source: dto.source,
      assignedToUserId: dto.assignedToUserId,
      status: dto.status,
      leadScore: dto.leadScore,
      priority: dto.priority,
      expectedDealSize: dto.expectedDealSize,
      notes: dto.notes,
      need: dto.need,
      authority: dto.authority,
      budgetNotes: dto.budgetNotes,
      timeline: dto.timeline,
      painPoints: dto.painPoints,
      decisionMaker: dto.decisionMaker,
      competitor: dto.competitor,
      qualificationNotes: dto.qualificationNotes,
    };
  },

  toUpdateLeadCommand(dto: UpdateLeadDto): UpdateLeadCommand {
    return {
      code: dto.code,
      company: dto.company,
      contactPerson: dto.contactPerson,
      email: dto.email,
      phone: dto.phone,
      whatsapp: dto.whatsapp,
      website: dto.website,
      industry: dto.industry,
      country: dto.country,
      source: dto.source,
      assignedToUserId: dto.assignedToUserId,
      status: dto.status,
      leadScore: dto.leadScore,
      priority: dto.priority,
      expectedDealSize: dto.expectedDealSize,
      notes: dto.notes,
      need: dto.need,
      authority: dto.authority,
      budgetNotes: dto.budgetNotes,
      timeline: dto.timeline,
      painPoints: dto.painPoints,
      decisionMaker: dto.decisionMaker,
      competitor: dto.competitor,
      qualificationNotes: dto.qualificationNotes,
    };
  },

  toRestoreLeadCommand(dto: RestoreLeadDto): RestoreLeadCommand {
    return {
      targetStatus: dto.targetStatus,
    };
  },

  toListLeadsQuery(dto: ListLeadsQueryDto): ListLeadsQuery {
    return {
      skip: dto.skip,
      take: dto.take,
      q: dto.q,
      status: dto.status,
      source: dto.source,
      assignedToUserId: dto.assignedToUserId,
      priority: dto.priority,
      industry: dto.industry,
      country: dto.country,
      includeArchived: dto.includeArchived,
      archivedOnly: dto.archivedOnly,
      sortBy: dto.sortBy,
      sortOrder: dto.sortOrder,
    };
  },
};
