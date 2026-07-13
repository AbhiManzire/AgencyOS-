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
export class WhatsAppIntakeProvider implements LeadIntakeProvider {
  readonly key = 'whatsapp';
  readonly label = 'WhatsApp';
  readonly defaultSource: LeadSource = 'WHATSAPP';

  normalize(payload: unknown): NormalizedLeadIntake {
    const raw = requireObjectPayload(payload);
    const contacts = Array.isArray(raw.contacts) ? raw.contacts : [];
    const firstContact =
      contacts.length > 0 &&
      contacts[0] !== null &&
      typeof contacts[0] === 'object' &&
      !Array.isArray(contacts[0])
        ? (contacts[0] as Record<string, unknown>)
        : {};
    const profile =
      firstContact.profile !== null &&
      typeof firstContact.profile === 'object' &&
      !Array.isArray(firstContact.profile)
        ? (firstContact.profile as Record<string, unknown>)
        : {};

    const flat: Record<string, unknown> = { ...raw, ...firstContact, ...profile };
    const company =
      readString(flat, ['company', 'company_name', 'business_name']) ??
      readString(flat, ['name', 'profile_name', 'pushname', 'wa_name']) ??
      requireCompany(flat);

    const phone = normalizePhoneDigits(
      readString(flat, ['phone', 'wa_id', 'from', 'phone_number', 'mobile']),
    );
    const whatsapp = phone ?? readString(flat, ['whatsapp', 'wa_id', 'from']);

    return buildNormalizedLead({
      company,
      contactPerson: readString(flat, ['contactPerson', 'name', 'profile_name', 'pushname']),
      email: readString(flat, ['email']),
      phone,
      whatsapp,
      notes: readString(flat, ['notes', 'message', 'text', 'body']),
      externalId: readString(flat, ['externalId', 'external_id', 'message_id', 'wamid', 'id']),
      campaignCode: readString(flat, ['campaignCode', 'campaign_code']),
      metadata: {
        provider: this.key,
        conversationId: readString(flat, ['conversationId', 'conversation_id']),
      },
    });
  }
}
