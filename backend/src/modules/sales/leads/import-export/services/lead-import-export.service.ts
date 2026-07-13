import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { LeadPriority, LeadSource, LeadStatus } from '@prisma/client';
import ExcelJS from 'exceljs';
import { LeadDomainError } from '../../domain/lead-domain.errors';
import {
  LEAD_REPOSITORY,
  type LeadRecord,
  type LeadRepository,
  type LeadScope,
} from '../../repositories/lead.repository.interface';
import type {
  CreateLeadCommand,
  LeadApplicationContext,
  ListLeadsQuery,
  UpdateLeadCommand,
} from '../../services/lead-application.types';
import { LeadService } from '../../services/lead.service';
import {
  LEAD_IMPORT_CANONICAL_FIELDS,
  type DuplicateStrategy,
  type ExportLeadsOptions,
  type ImportCommitRow,
  type ImportPreviewResult,
  type ImportPreviewRow,
  type ImportSummary,
  type LeadImportCanonicalField,
  type MappedLeadImportData,
  type ParsedImportFile,
} from '../lead-import-export.types';

const EXPORT_PAGE_SIZE = 500;

const VALID_SOURCES: ReadonlySet<string> = new Set([
  'MANUAL',
  'WEBSITE',
  'META_ADS',
  'GOOGLE_ADS',
  'WHATSAPP',
  'EMAIL',
  'CALL',
  'REFERRAL',
  'IMPORT',
  'API',
  'WEBHOOK',
]);

const VALID_PRIORITIES: ReadonlySet<string> = new Set(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

const VALID_STATUSES: ReadonlySet<string> = new Set([
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'DISQUALIFIED',
  'CONVERTED',
  'ARCHIVED',
]);

@Injectable()
export class LeadImportExportService {
  constructor(
    @Inject(LEAD_REPOSITORY)
    private readonly leadRepository: LeadRepository,
    private readonly leadService: LeadService,
  ) {}

  getTemplateCsv(): string {
    return `${LEAD_IMPORT_CANONICAL_FIELDS.join(',')}\n`;
  }

  async getTemplateXlsx(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Leads');
    sheet.addRow([...LEAD_IMPORT_CANONICAL_FIELDS]);
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async parseFile(buffer: Buffer, mimeOrFilename: string): Promise<ParsedImportFile> {
    const hint = mimeOrFilename.toLowerCase();
    const isXlsx =
      hint.includes('spreadsheetml') ||
      hint.endsWith('.xlsx') ||
      hint.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') ||
      hint.includes('application/vnd.ms-excel');

    if (isXlsx && !hint.includes('csv')) {
      return this.parseXlsx(buffer);
    }

    if (hint.includes('csv') || hint.endsWith('.csv') || hint.includes('text/plain') || !isXlsx) {
      return this.parseCsv(buffer.toString('utf8'));
    }

    return this.parseXlsx(buffer);
  }

  async preview(
    scope: LeadScope,
    rows: readonly Record<string, string>[],
    mapping: Record<string, string>,
    options: {
      readonly duplicateStrategy: DuplicateStrategy;
      readonly fileHeaders?: readonly string[];
    },
  ): Promise<ImportPreviewResult> {
    const fileHeaders = options.fileHeaders ?? (rows.length > 0 ? Object.keys(rows[0] ?? {}) : []);
    const appliedMapping = buildAppliedMapping(fileHeaders, mapping);

    const mappedRows = rows.map((row, index) => ({
      rowNumber: index + 2,
      data: mapRowToCanonical(row, appliedMapping),
    }));

    const emails = mappedRows
      .map((row) => normalizeEmail(row.data.email))
      .filter((email): email is string => email !== null);

    const existingByEmail = await this.loadExistingByEmail(scope, emails);
    const seenInFile = new Map<string, number>();

    const previewRows: ImportPreviewRow[] = mappedRows.map((row) => {
      const validationErrors = validateMappedRow(row.data);
      const duplicateMessages: string[] = [];
      const email = normalizeEmail(row.data.email);
      let duplicateLeadId: string | undefined;
      let isDuplicate = false;

      if (email !== null) {
        const existing = existingByEmail.get(email);
        const priorRow = seenInFile.get(email);

        if (priorRow !== undefined) {
          isDuplicate = true;
          duplicateMessages.push(
            `Duplicate email within file (first seen on row ${String(priorRow)}).`,
          );
        } else {
          seenInFile.set(email, row.rowNumber);
        }

        if (existing !== undefined) {
          duplicateLeadId = existing.id;
          if (options.duplicateStrategy !== 'create') {
            isDuplicate = true;
            duplicateMessages.push(`Email matches existing lead ${existing.id}.`);
          }
        }
      }

      let status: ImportPreviewRow['status'];
      let errors: readonly string[];

      if (validationErrors.length > 0) {
        status = 'invalid';
        errors = validationErrors;
      } else if (isDuplicate) {
        status = 'duplicate';
        errors = duplicateMessages;
      } else {
        status = 'valid';
        errors = [];
      }

      return {
        rowNumber: row.rowNumber,
        data: row.data,
        errors,
        ...(duplicateLeadId !== undefined ? { duplicateLeadId } : {}),
        status,
      };
    });

    return {
      fileHeaders,
      appliedMapping,
      rows: previewRows,
      summary: {
        total: previewRows.length,
        valid: previewRows.filter((row) => row.status === 'valid').length,
        invalid: previewRows.filter((row) => row.status === 'invalid').length,
        duplicates: previewRows.filter((row) => row.status === 'duplicate').length,
      },
    };
  }

  async commit(
    scope: LeadScope,
    rows: readonly ImportCommitRow[],
    context: LeadApplicationContext,
    _options?: { readonly duplicateStrategy?: DuplicateStrategy },
  ): Promise<ImportSummary> {
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;
    const errors: { rowNumber: number; message: string }[] = [];

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const rowNumber = row.rowNumber ?? index + 1;

      try {
        if (row.action === 'skip') {
          skipped += 1;
          continue;
        }

        if (row.action === 'create') {
          await this.leadService.createImportedLead(scope, toCreateCommand(row.data), context);
          created += 1;
          continue;
        }

        if (row.existingLeadId === undefined || row.existingLeadId.trim().length === 0) {
          throw new BadRequestException('existingLeadId is required for update action.');
        }
        await this.leadService.updateLead(
          scope,
          row.existingLeadId,
          toUpdateCommand(row.data),
          context,
        );
        updated += 1;
      } catch (error) {
        failed += 1;
        errors.push({
          rowNumber,
          message: errorMessage(error),
        });
      }
    }

    return { created, updated, skipped, failed, errors };
  }

  async exportLeads(
    scope: LeadScope,
    options: ExportLeadsOptions,
  ): Promise<{ readonly buffer: Buffer; readonly contentType: string; readonly filename: string }> {
    const leads = await this.resolveExportLeads(scope, options);
    const filename =
      options.format === 'csv'
        ? `leads-export-${formatDateStamp()}.csv`
        : `leads-export-${formatDateStamp()}.xlsx`;

    if (options.format === 'csv') {
      return {
        buffer: Buffer.from(this.leadsToCsv(leads), 'utf8'),
        contentType: 'text/csv; charset=utf-8',
        filename,
      };
    }

    return {
      buffer: await this.leadsToXlsx(leads),
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      filename,
    };
  }

  private async resolveExportLeads(
    scope: LeadScope,
    options: ExportLeadsOptions,
  ): Promise<readonly LeadRecord[]> {
    if (options.mode === 'selected') {
      if (options.leadIds === undefined || options.leadIds.length === 0) {
        throw new BadRequestException('leadIds are required when mode is selected.');
      }
      return this.leadRepository.findByIds(scope, options.leadIds);
    }

    const filters = options.filters ?? {};
    const query: ListLeadsQuery = {
      q: filters.q,
      status: filters.status as LeadStatus | undefined,
      source: filters.source as LeadSource | undefined,
      assignedToUserId: filters.assignedToUserId,
      campaignId: filters.campaignId,
      priority: filters.priority as LeadPriority | undefined,
      industry: filters.industry,
      country: filters.country,
      includeArchived: filters.includeArchived,
      archivedOnly: filters.archivedOnly,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    };

    if (options.mode === 'all') {
      return this.fetchAllLeads(scope, {});
    }

    return this.fetchAllLeads(scope, query);
  }

  private async fetchAllLeads(
    scope: LeadScope,
    query: ListLeadsQuery,
  ): Promise<readonly LeadRecord[]> {
    const items: LeadRecord[] = [];
    let skip = 0;

    for (;;) {
      const page = await this.leadService.listLeads(scope, {
        ...query,
        skip,
        take: EXPORT_PAGE_SIZE,
      });
      items.push(...page.items);
      if (page.items.length < EXPORT_PAGE_SIZE || items.length >= page.total) {
        break;
      }
      skip += EXPORT_PAGE_SIZE;
    }

    return items;
  }

  private async loadExistingByEmail(
    scope: LeadScope,
    emails: readonly string[],
  ): Promise<Map<string, LeadRecord>> {
    const existing = await this.leadRepository.findByEmails(scope, emails);
    const map = new Map<string, LeadRecord>();
    for (const lead of existing) {
      if (lead.email !== null) {
        map.set(lead.email.trim().toLowerCase(), lead);
      }
    }
    return map;
  }

  private parseCsv(content: string): ParsedImportFile {
    const records = parseCsvRecords(content);
    if (records.length === 0) {
      return { headers: [], rows: [] };
    }

    const headers = records[0].map((header) => header.trim());
    const rows = records.slice(1).map((values) => {
      const row: Record<string, string> = {};
      for (let i = 0; i < headers.length; i += 1) {
        const header = headers[i];
        if (header.length === 0) {
          continue;
        }
        row[header] = values[i] ?? '';
      }
      return row;
    });

    return { headers, rows };
  }

  private async parseXlsx(buffer: Buffer): Promise<ParsedImportFile> {
    const workbook = new ExcelJS.Workbook();
    // exceljs typings expect Buffer; runtime accepts Uint8Array/Buffer interchangeably
    await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
    const sheet = workbook.worksheets.at(0);
    if (sheet === undefined) {
      return { headers: [], rows: [] };
    }

    const rows: string[][] = [];
    sheet.eachRow({ includeEmpty: false }, (row) => {
      const values: string[] = [];
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        while (values.length < colNumber - 1) {
          values.push('');
        }
        values.push(cellValueToString(cell.value));
      });
      rows.push(values);
    });

    if (rows.length === 0) {
      return { headers: [], rows: [] };
    }

    const headers = rows[0].map((header) => header.trim());
    const dataRows = rows.slice(1).map((values) => {
      const row: Record<string, string> = {};
      for (let i = 0; i < headers.length; i += 1) {
        const header = headers[i];
        if (header.length === 0) {
          continue;
        }
        row[header] = values[i] ?? '';
      }
      return row;
    });

    return { headers, rows: dataRows };
  }

  private leadsToCsv(leads: readonly LeadRecord[]): string {
    const lines = [LEAD_IMPORT_CANONICAL_FIELDS.join(',')];
    for (const lead of leads) {
      lines.push(
        LEAD_IMPORT_CANONICAL_FIELDS.map((field) => csvEscape(leadFieldValue(lead, field))).join(
          ',',
        ),
      );
    }
    return `${lines.join('\n')}\n`;
  }

  private async leadsToXlsx(leads: readonly LeadRecord[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Leads');
    sheet.addRow([...LEAD_IMPORT_CANONICAL_FIELDS]);
    for (const lead of leads) {
      sheet.addRow(LEAD_IMPORT_CANONICAL_FIELDS.map((field) => leadFieldValue(lead, field)));
    }
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}

function mapRowToCanonical(
  row: Record<string, string>,
  mapping: Record<string, string>,
): MappedLeadImportData {
  const data: Record<string, string> = {};

  for (const field of LEAD_IMPORT_CANONICAL_FIELDS) {
    const mappedHeader = mapping[field] ?? field;
    const value =
      mappedHeader in row ? row[mappedHeader] : findRowValueCaseInsensitive(row, mappedHeader);
    if (value !== undefined && value.trim().length > 0) {
      data[field] = value.trim();
    }
  }

  return data;
}

function buildAppliedMapping(
  fileHeaders: readonly string[],
  mapping: Record<string, string>,
): Record<string, string> {
  const applied: Record<string, string> = { ...mapping };
  const headerLookup = new Map(fileHeaders.map((header) => [header.toLowerCase(), header]));

  for (const field of LEAD_IMPORT_CANONICAL_FIELDS) {
    if (Object.hasOwn(applied, field) && applied[field].trim().length > 0) {
      continue;
    }

    const exact = headerLookup.get(field.toLowerCase());
    if (exact !== undefined) {
      applied[field] = exact;
    }
  }

  return applied;
}

function findRowValueCaseInsensitive(row: Record<string, string>, key: string): string | undefined {
  if (Object.hasOwn(row, key)) {
    return row[key];
  }

  const lower = key.toLowerCase();
  for (const [header, value] of Object.entries(row)) {
    if (header.toLowerCase() === lower) {
      return value;
    }
  }

  return undefined;
}

function validateMappedRow(data: MappedLeadImportData): string[] {
  const errors: string[] = [];

  if (data.company === undefined || data.company.trim().length === 0) {
    errors.push('Company is required.');
  }

  if (data.email !== undefined && data.email.trim().length > 0) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
      errors.push('Email must be a valid email address.');
    }
  }

  if (data.phone !== undefined && data.phone.trim().length > 0) {
    if (!/^\d{7,15}$/.test(data.phone.trim())) {
      errors.push('Phone must contain 7 to 15 digits only.');
    }
  }

  if (data.website !== undefined && data.website.trim().length > 0) {
    if (!isValidWebsite(data.website.trim())) {
      errors.push('Website must be a valid URL.');
    }
  }

  if (data.source !== undefined && data.source.trim().length > 0) {
    if (!VALID_SOURCES.has(data.source.trim().toUpperCase())) {
      errors.push(`Source "${data.source}" is invalid.`);
    }
  }

  if (data.priority !== undefined && data.priority.trim().length > 0) {
    if (!VALID_PRIORITIES.has(data.priority.trim().toUpperCase())) {
      errors.push(`Priority "${data.priority}" is invalid.`);
    }
  }

  if (data.status !== undefined && data.status.trim().length > 0) {
    const status = data.status.trim().toUpperCase();
    if (!VALID_STATUSES.has(status)) {
      errors.push(`Status "${data.status}" is invalid.`);
    } else if (status === 'CONVERTED' || status === 'ARCHIVED') {
      errors.push(`Status "${status}" is not allowed when importing a lead.`);
    }
  }

  if (data.expectedDealSize !== undefined && data.expectedDealSize.trim().length > 0) {
    const amount = Number(data.expectedDealSize);
    if (!Number.isFinite(amount) || amount <= 0) {
      errors.push('Expected deal size must be a positive number.');
    }
  }

  if (data.assignedToUserId !== undefined && data.assignedToUserId.trim().length > 0) {
    if (!isUuid(data.assignedToUserId.trim())) {
      errors.push('assignedToUserId must be a valid UUID.');
    }
  }

  if (data.campaignId !== undefined && data.campaignId.trim().length > 0) {
    if (!isUuid(data.campaignId.trim())) {
      errors.push('campaignId must be a valid UUID.');
    }
  }

  return errors;
}

function toCreateCommand(data: MappedLeadImportData): CreateLeadCommand {
  return {
    company: data.company ?? '',
    ...(data.contactPerson !== undefined ? { contactPerson: data.contactPerson } : {}),
    ...(data.email !== undefined ? { email: data.email } : {}),
    ...(data.phone !== undefined ? { phone: data.phone } : {}),
    ...(data.whatsapp !== undefined ? { whatsapp: data.whatsapp } : {}),
    ...(data.website !== undefined ? { website: data.website } : {}),
    ...(data.industry !== undefined ? { industry: data.industry } : {}),
    ...(data.country !== undefined ? { country: data.country } : {}),
    ...(data.source !== undefined
      ? { source: data.source.trim().toUpperCase() as LeadSource }
      : { source: 'IMPORT' }),
    ...(data.priority !== undefined
      ? { priority: data.priority.trim().toUpperCase() as LeadPriority }
      : {}),
    ...(data.status !== undefined
      ? { status: data.status.trim().toUpperCase() as LeadStatus }
      : {}),
    ...(data.notes !== undefined ? { notes: data.notes } : {}),
    ...(data.expectedDealSize !== undefined
      ? { expectedDealSize: Number(data.expectedDealSize) }
      : {}),
    ...(data.assignedToUserId !== undefined ? { assignedToUserId: data.assignedToUserId } : {}),
    ...(data.campaignId !== undefined ? { campaignId: data.campaignId } : {}),
    ...(data.code !== undefined ? { code: data.code } : {}),
  };
}

function toUpdateCommand(data: MappedLeadImportData): UpdateLeadCommand {
  return {
    ...(data.company !== undefined ? { company: data.company } : {}),
    ...(data.contactPerson !== undefined ? { contactPerson: data.contactPerson } : {}),
    ...(data.email !== undefined ? { email: data.email } : {}),
    ...(data.phone !== undefined ? { phone: data.phone } : {}),
    ...(data.whatsapp !== undefined ? { whatsapp: data.whatsapp } : {}),
    ...(data.website !== undefined ? { website: data.website } : {}),
    ...(data.industry !== undefined ? { industry: data.industry } : {}),
    ...(data.country !== undefined ? { country: data.country } : {}),
    ...(data.source !== undefined
      ? { source: data.source.trim().toUpperCase() as LeadSource }
      : {}),
    ...(data.priority !== undefined
      ? { priority: data.priority.trim().toUpperCase() as LeadPriority }
      : {}),
    ...(data.status !== undefined &&
    data.status.trim().toUpperCase() !== 'CONVERTED' &&
    data.status.trim().toUpperCase() !== 'ARCHIVED'
      ? { status: data.status.trim().toUpperCase() as LeadStatus }
      : {}),
    ...(data.notes !== undefined ? { notes: data.notes } : {}),
    ...(data.expectedDealSize !== undefined
      ? { expectedDealSize: Number(data.expectedDealSize) }
      : {}),
    ...(data.assignedToUserId !== undefined ? { assignedToUserId: data.assignedToUserId } : {}),
    ...(data.campaignId !== undefined ? { campaignId: data.campaignId } : {}),
    ...(data.code !== undefined ? { code: data.code } : {}),
  };
}

function leadFieldValue(lead: LeadRecord, field: LeadImportCanonicalField): string {
  switch (field) {
    case 'company':
      return lead.company;
    case 'contactPerson':
      return lead.contactPerson ?? '';
    case 'email':
      return lead.email ?? '';
    case 'phone':
      return lead.phone ?? '';
    case 'whatsapp':
      return lead.whatsapp ?? '';
    case 'website':
      return lead.website ?? '';
    case 'industry':
      return lead.industry ?? '';
    case 'country':
      return lead.country ?? '';
    case 'source':
      return lead.source;
    case 'priority':
      return lead.priority;
    case 'status':
      return lead.status;
    case 'notes':
      return lead.notes ?? '';
    case 'expectedDealSize':
      return lead.expectedDealSize === null ? '' : String(lead.expectedDealSize);
    case 'assignedToUserId':
      return lead.assignedToUserId ?? '';
    case 'campaignId':
      return lead.campaignId ?? '';
    case 'code':
      return lead.code ?? '';
    default:
      return '';
  }
}

function normalizeEmail(value: string | undefined): string | null {
  if (value === undefined) {
    return null;
  }
  const trimmed = value.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

function errorMessage(error: unknown): string {
  if (error instanceof LeadDomainError || error instanceof Error) {
    return error.message;
  }
  return 'Unknown import error.';
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isValidWebsite(website: string): boolean {
  try {
    const withProtocol = /^https?:\/\//i.test(website) ? website : `https://${website}`;
    const url = new URL(withProtocol);
    return url.hostname.length > 0 && url.hostname.includes('.');
  } catch {
    return false;
  }
}

function formatDateStamp(): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  return `${String(yyyy)}${mm}${dd}`;
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function cellValueToString(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'object' && 'text' in value && typeof value.text === 'string') {
    return value.text;
  }
  if (typeof value === 'object' && 'result' in value) {
    return cellValueToString(value.result);
  }
  if (typeof value === 'object') {
    return '[object Object]';
  }
  return String(value);
}

/** RFC 4180 CSV parser supporting quoted fields and escaped quotes. */
function parseCsvRecords(content: string): string[][] {
  const records: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;
  const input = content.replace(/^\uFEFF/, '');

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ',') {
      row.push(field);
      field = '';
      continue;
    }

    if (char === '\n') {
      row.push(field);
      records.push(row);
      row = [];
      field = '';
      continue;
    }

    if (char === '\r') {
      if (next === '\n') {
        continue;
      }
      row.push(field);
      records.push(row);
      row = [];
      field = '';
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    records.push(row);
  }

  return records.filter((record) => !(record.length === 1 && record[0] === ''));
}
