export const LEAD_IMPORT_CANONICAL_FIELDS = [
  'company',
  'contactPerson',
  'email',
  'phone',
  'whatsapp',
  'website',
  'industry',
  'country',
  'source',
  'priority',
  'status',
  'notes',
  'expectedDealSize',
  'assignedToUserId',
  'campaignId',
  'code',
] as const;

export type LeadImportCanonicalField = (typeof LEAD_IMPORT_CANONICAL_FIELDS)[number];

export type DuplicateStrategy = 'skip' | 'update' | 'create';

export type ImportPreviewRowStatus = 'valid' | 'invalid' | 'duplicate';

export type ImportCommitAction = 'create' | 'update' | 'skip';

export interface MappedLeadImportData {
  readonly company?: string;
  readonly contactPerson?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly whatsapp?: string;
  readonly website?: string;
  readonly industry?: string;
  readonly country?: string;
  readonly source?: string;
  readonly priority?: string;
  readonly status?: string;
  readonly notes?: string;
  readonly expectedDealSize?: string;
  readonly assignedToUserId?: string;
  readonly campaignId?: string;
  readonly code?: string;
}

export interface ImportPreviewRow {
  readonly rowNumber: number;
  readonly data: MappedLeadImportData;
  readonly errors: readonly string[];
  readonly duplicateLeadId?: string;
  readonly status: ImportPreviewRowStatus;
}

export interface ImportPreviewResult {
  readonly fileHeaders: readonly string[];
  readonly appliedMapping: Readonly<Record<string, string>>;
  readonly rows: readonly ImportPreviewRow[];
  readonly summary: {
    readonly total: number;
    readonly valid: number;
    readonly invalid: number;
    readonly duplicates: number;
  };
}

export interface ImportCommitRow {
  readonly rowNumber?: number;
  readonly data: MappedLeadImportData;
  readonly action: ImportCommitAction;
  readonly existingLeadId?: string;
}

export interface ImportSummary {
  readonly created: number;
  readonly updated: number;
  readonly skipped: number;
  readonly failed: number;
  readonly errors: readonly { readonly rowNumber: number; readonly message: string }[];
}

export interface ExportLeadsOptions {
  readonly format: 'csv' | 'xlsx';
  readonly mode: 'filter' | 'selected' | 'all';
  readonly leadIds?: readonly string[];
  readonly filters?: {
    readonly q?: string;
    readonly status?: string;
    readonly source?: string;
    readonly assignedToUserId?: string;
    readonly campaignId?: string;
    readonly priority?: string;
    readonly industry?: string;
    readonly country?: string;
    readonly includeArchived?: boolean;
    readonly archivedOnly?: boolean;
    readonly sortBy?: 'updatedAt' | 'createdAt' | 'company' | 'leadScore' | 'priority';
    readonly sortOrder?: 'asc' | 'desc';
  };
}

export interface ParsedImportFile {
  readonly headers: string[];
  readonly rows: Record<string, string>[];
}
