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
export class PublicApiIntakeProvider implements LeadIntakeProvider {
  readonly key = 'public_api';
  readonly label = 'Public API';
  readonly defaultSource: LeadSource = 'API';

  normalize(payload: unknown): NormalizedLeadIntake {
    const raw = requireObjectPayload(payload);
    const company = requireCompany(raw);
    const phone = normalizePhoneDigits(readString(raw, ['phone']));

    return buildNormalizedLead({
      company,
      contactPerson: readString(raw, ['contactPerson', 'contact_person']),
      email: readString(raw, ['email']),
      phone,
      whatsapp: readString(raw, ['whatsapp']),
      website: readString(raw, ['website']),
      industry: readString(raw, ['industry']),
      country: readString(raw, ['country']),
      notes: readString(raw, ['notes']),
      externalId: readString(raw, ['externalId', 'external_id']),
      campaignCode: readString(raw, ['campaignCode', 'campaign_code']),
      metadata: {
        provider: this.key,
        code: readString(raw, ['code']),
        source: readString(raw, ['source']),
      },
    });
  }
}
