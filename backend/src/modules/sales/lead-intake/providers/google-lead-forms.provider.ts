import { Injectable } from '@nestjs/common';
import type { LeadSource } from '@prisma/client';
import type { LeadIntakeProvider, NormalizedLeadIntake } from '../lead-intake.types';
import {
  buildNormalizedLead,
  normalizePhoneDigits,
  readString,
  requireCompany,
  requireObjectPayload,
} from './intake-normalize.util';

@Injectable()
export class GoogleLeadFormsProvider implements LeadIntakeProvider {
  readonly key = 'google_lead_forms';
  readonly label = 'Google Lead Forms';
  readonly defaultSource: LeadSource = 'GOOGLE_ADS';

  normalize(payload: unknown): NormalizedLeadIntake {
    const raw = requireObjectPayload(payload);
    const columnMap = readUserColumnData(raw.user_column_data ?? raw.userColumnData);
    const flat: Record<string, unknown> = { ...raw, ...columnMap };

    const company = requireCompany(flat, [
      'company',
      'company_name',
      'COMPANY_NAME',
      'business_name',
      'organization',
    ]);

    const contactPerson = readString(flat, [
      'full_name',
      'FULL_NAME',
      'contactPerson',
      'name',
      'first_name',
    ]);
    const email = readString(flat, ['email', 'EMAIL', 'work_email']);
    const phone = normalizePhoneDigits(
      readString(flat, ['phone', 'PHONE_NUMBER', 'phone_number', 'mobile']),
    );

    return buildNormalizedLead({
      company,
      contactPerson,
      email,
      phone,
      website: readString(flat, ['website', 'WEBSITE']),
      notes: readString(flat, ['notes', 'message', 'comments']),
      externalId: readString(flat, ['lead_id', 'gclid', 'id', 'externalId', 'external_id']),
      campaignCode: readString(flat, [
        'campaign_id',
        'campaignId',
        'campaign_code',
        'campaignCode',
      ]),
      metadata: {
        provider: this.key,
        formId: readString(flat, ['form_id', 'formId']),
        creativeId: readString(flat, ['creative_id', 'creativeId']),
      },
    });
  }
}

function readUserColumnData(columnData: unknown): Record<string, string> {
  if (!Array.isArray(columnData)) {
    return {};
  }

  const result: Record<string, string> = {};
  for (const entry of columnData) {
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
      continue;
    }
    const row = entry as Record<string, unknown>;
    const columnId =
      typeof row.column_id === 'string'
        ? row.column_id
        : typeof row.columnId === 'string'
          ? row.columnId
          : typeof row.column_name === 'string'
            ? row.column_name
            : '';
    const value =
      typeof row.string_value === 'string'
        ? row.string_value.trim()
        : typeof row.stringValue === 'string'
          ? row.stringValue.trim()
          : typeof row.value === 'string'
            ? row.value.trim()
            : '';

    if (columnId.length > 0 && value.length > 0) {
      result[columnId] = value;
      result[columnId.toLowerCase()] = value;
    }
  }
  return result;
}
