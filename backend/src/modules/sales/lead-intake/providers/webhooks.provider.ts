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
export class WebhooksIntakeProvider implements LeadIntakeProvider {
  readonly key = 'webhooks';
  readonly label = 'Generic Webhooks';
  readonly defaultSource: LeadSource = 'WEBHOOK';

  normalize(payload: unknown): NormalizedLeadIntake {
    const raw = requireObjectPayload(payload);
    const nested =
      raw.lead !== null && typeof raw.lead === 'object' && !Array.isArray(raw.lead)
        ? { ...raw, ...(raw.lead as Record<string, unknown>) }
        : raw;

    const company = requireCompany(nested);
    const phone = normalizePhoneDigits(
      readString(nested, ['phone', 'phoneNumber', 'phone_number']),
    );

    return buildNormalizedLead({
      company,
      contactPerson: readString(nested, [
        'contactPerson',
        'contact_person',
        'full_name',
        'fullName',
        'name',
      ]),
      email: readString(nested, ['email']),
      phone,
      whatsapp: readString(nested, ['whatsapp']),
      website: readString(nested, ['website']),
      industry: readString(nested, ['industry']),
      country: readString(nested, ['country']),
      notes: readString(nested, ['notes', 'message', 'description']),
      externalId: readString(nested, ['externalId', 'external_id', 'id']),
      campaignCode: readString(nested, ['campaignCode', 'campaign_code']),
      metadata: {
        provider: this.key,
        event: readString(nested, ['event', 'eventType', 'event_type']),
      },
    });
  }
}
