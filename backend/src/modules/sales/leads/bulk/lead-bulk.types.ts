import type { LeadStatus } from '@prisma/client';

export interface BulkActionResult {
  readonly succeeded: readonly string[];
  readonly failed: readonly { readonly id: string; readonly message: string }[];
}

export interface BulkAssignOwnerCommand {
  readonly leadIds: readonly string[];
  readonly assignedToUserId: string;
}

export interface BulkChangeStatusCommand {
  readonly leadIds: readonly string[];
  readonly status: LeadStatus;
}

export interface BulkAddTagsCommand {
  readonly leadIds: readonly string[];
  readonly tagNames: readonly string[];
}

export interface BulkDeleteCommand {
  readonly leadIds: readonly string[];
}

export interface BulkExportCommand {
  readonly leadIds: readonly string[];
  readonly format: 'csv' | 'xlsx';
}
