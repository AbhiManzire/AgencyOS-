import { BadRequestException } from '@nestjs/common';
import type { NormalizedLeadIntake } from '../lead-intake.types';

export function requireObjectPayload(payload: unknown): Record<string, unknown> {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new BadRequestException('Intake payload must be a JSON object.');
  }
  return payload as Record<string, unknown>;
}

export function readString(
  source: Record<string, unknown>,
  keys: readonly string[],
): string | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }
  return undefined;
}

export function requireCompany(
  source: Record<string, unknown>,
  keys: readonly string[] = [
    'company',
    'company_name',
    'companyName',
    'business_name',
    'organization',
  ],
): string {
  const company = readString(source, keys);
  if (company === undefined) {
    throw new BadRequestException('Company is required for lead intake.');
  }
  return company;
}

export function normalizePhoneDigits(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  const digits = value.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15 ? digits : undefined;
}

export function buildNormalizedLead(
  partial: Omit<NormalizedLeadIntake, 'company'> & { company: string },
): NormalizedLeadIntake {
  return {
    company: partial.company,
    ...(partial.contactPerson !== undefined ? { contactPerson: partial.contactPerson } : {}),
    ...(partial.email !== undefined ? { email: partial.email } : {}),
    ...(partial.phone !== undefined ? { phone: partial.phone } : {}),
    ...(partial.whatsapp !== undefined ? { whatsapp: partial.whatsapp } : {}),
    ...(partial.website !== undefined ? { website: partial.website } : {}),
    ...(partial.industry !== undefined ? { industry: partial.industry } : {}),
    ...(partial.country !== undefined ? { country: partial.country } : {}),
    ...(partial.notes !== undefined ? { notes: partial.notes } : {}),
    ...(partial.externalId !== undefined ? { externalId: partial.externalId } : {}),
    ...(partial.campaignCode !== undefined ? { campaignCode: partial.campaignCode } : {}),
    ...(partial.metadata !== undefined ? { metadata: partial.metadata } : {}),
  };
}

export function readFieldDataMap(fieldData: unknown): Record<string, string> {
  if (!Array.isArray(fieldData)) {
    return {};
  }

  const result: Record<string, string> = {};
  for (const entry of fieldData) {
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
      continue;
    }
    const row = entry as Record<string, unknown>;
    const name = typeof row.name === 'string' ? row.name.trim().toLowerCase() : '';
    if (name.length === 0) {
      continue;
    }

    let value: string | undefined;
    if (Array.isArray(row.values) && row.values.length > 0) {
      const first: unknown = row.values[0];
      if (typeof first === 'string' && first.trim().length > 0) {
        value = first.trim();
      }
    } else if (typeof row.value === 'string' && row.value.trim().length > 0) {
      value = row.value.trim();
    }

    if (value !== undefined) {
      result[name] = value;
    }
  }

  return result;
}
