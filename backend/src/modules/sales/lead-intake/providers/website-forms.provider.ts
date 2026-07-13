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
export class WebsiteFormsProvider implements LeadIntakeProvider {
  readonly key = 'website_forms';
  readonly label = 'Website Forms';
  readonly defaultSource: LeadSource = 'WEBSITE';

  normalize(payload: unknown): NormalizedLeadIntake {
    const raw = requireObjectPayload(payload);
    const data =
      raw.data !== null && typeof raw.data === 'object' && !Array.isArray(raw.data)
        ? { ...raw, ...(raw.data as Record<string, unknown>) }
        : raw;

    const company = requireCompany(data);
    const contactPerson = readString(data, [
      'contactPerson',
      'contact_person',
      'full_name',
      'fullName',
      'name',
    ]);
    const email = readString(data, ['email', 'email_address']);
    const phone = normalizePhoneDigits(readString(data, ['phone', 'phone_number', 'tel']));

    return buildNormalizedLead({
      company,
      contactPerson,
      email,
      phone,
      whatsapp: readString(data, ['whatsapp', 'whatsApp']),
      website: readString(data, ['website', 'url']),
      industry: readString(data, ['industry']),
      country: readString(data, ['country']),
      notes: readString(data, ['notes', 'message', 'comments', 'inquiry']),
      externalId: readString(data, [
        'externalId',
        'external_id',
        'submissionId',
        'submission_id',
        'id',
      ]),
      campaignCode: readString(data, ['campaignCode', 'campaign_code', 'utm_campaign']),
      metadata: {
        provider: this.key,
        formName: readString(data, ['formName', 'form_name', 'formId', 'form_id']),
        pageUrl: readString(data, ['pageUrl', 'page_url', 'referrer']),
      },
    });
  }
}
