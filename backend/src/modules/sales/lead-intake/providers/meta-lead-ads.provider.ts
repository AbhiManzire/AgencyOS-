import { Injectable } from '@nestjs/common';
import type { LeadSource } from '@prisma/client';
import type { LeadIntakeProvider, NormalizedLeadIntake } from '../lead-intake.types';
import {
  buildNormalizedLead,
  normalizePhoneDigits,
  readFieldDataMap,
  readString,
  requireCompany,
  requireObjectPayload,
} from './intake-normalize.util';

@Injectable()
export class MetaLeadAdsProvider implements LeadIntakeProvider {
  readonly key = 'meta_lead_ads';
  readonly label = 'Meta Lead Ads';
  readonly defaultSource: LeadSource = 'META_ADS';

  normalize(payload: unknown): NormalizedLeadIntake {
    const raw = requireObjectPayload(payload);
    const fieldMap = readFieldDataMap(raw.field_data ?? raw.fieldData);
    const flat: Record<string, unknown> = { ...raw, ...fieldMap };

    const company = requireCompany(flat, [
      'company',
      'company_name',
      'companyName',
      'business_name',
    ]);

    const contactPerson = readString(flat, [
      'full_name',
      'fullName',
      'contactPerson',
      'contact_person',
      'name',
    ]);
    const email = readString(flat, ['email', 'email_address', 'work_email']);
    const phone = normalizePhoneDigits(
      readString(flat, ['phone', 'phone_number', 'phoneNumber', 'mobile_phone']),
    );
    const externalId = readString(flat, [
      'leadgen_id',
      'leadgenId',
      'id',
      'externalId',
      'external_id',
    ]);
    const campaignCode = readString(flat, ['campaign_code', 'campaignCode', 'ad_campaign']);

    return buildNormalizedLead({
      company,
      contactPerson,
      email,
      phone,
      website: readString(flat, ['website', 'website_url']),
      notes: readString(flat, ['notes', 'message', 'comments']),
      externalId,
      campaignCode,
      metadata: {
        provider: this.key,
        formId: readString(flat, ['form_id', 'formId']),
        pageId: readString(flat, ['page_id', 'pageId']),
        adId: readString(flat, ['ad_id', 'adId']),
      },
    });
  }
}
