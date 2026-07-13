import { Injectable } from '@nestjs/common';
import { LeadDomainError } from '../../domain/lead-domain.errors';
import type { LeadApplicationContext, LeadScope } from '../../services/lead-application.types';
import { LeadTagService } from '../../services/lead-tag.service';
import { LeadService } from '../../services/lead.service';
import type {
  BulkActionResult,
  BulkAddTagsCommand,
  BulkAssignOwnerCommand,
  BulkChangeStatusCommand,
  BulkDeleteCommand,
} from '../lead-bulk.types';

@Injectable()
export class LeadBulkService {
  constructor(
    private readonly leadService: LeadService,
    private readonly leadTagService: LeadTagService,
  ) {}

  async assignOwner(
    scope: LeadScope,
    command: BulkAssignOwnerCommand,
    context: LeadApplicationContext,
  ): Promise<BulkActionResult> {
    return this.runForEach(command.leadIds, async (leadId) => {
      await this.leadService.updateLead(
        scope,
        leadId,
        { assignedToUserId: command.assignedToUserId },
        context,
      );
    });
  }

  async changeStatus(
    scope: LeadScope,
    command: BulkChangeStatusCommand,
    context: LeadApplicationContext,
  ): Promise<BulkActionResult> {
    return this.runForEach(command.leadIds, async (leadId) => {
      await this.leadService.updateLead(scope, leadId, { status: command.status }, context);
    });
  }

  async addTags(
    scope: LeadScope,
    command: BulkAddTagsCommand,
    context: LeadApplicationContext,
  ): Promise<BulkActionResult> {
    return this.runForEach(command.leadIds, async (leadId) => {
      for (const tagName of command.tagNames) {
        await this.leadTagService.assignTag(scope, leadId, { name: tagName }, context);
      }
    });
  }

  async deleteLeads(
    scope: LeadScope,
    command: BulkDeleteCommand,
    context: LeadApplicationContext,
  ): Promise<BulkActionResult> {
    return this.runForEach(command.leadIds, async (leadId) => {
      await this.leadService.archiveLead(scope, leadId, context);
    });
  }

  private async runForEach(
    leadIds: readonly string[],
    work: (leadId: string) => Promise<void>,
  ): Promise<BulkActionResult> {
    const succeeded: string[] = [];
    const failed: { id: string; message: string }[] = [];

    for (const leadId of leadIds) {
      try {
        await work(leadId);
        succeeded.push(leadId);
      } catch (error) {
        failed.push({
          id: leadId,
          message: errorMessage(error),
        });
      }
    }

    return { succeeded, failed };
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof LeadDomainError || error instanceof Error) {
    return error.message;
  }
  return 'Unknown bulk action error.';
}
