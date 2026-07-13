import { IntegrationCategory, IntegrationProviderKey } from '@prisma/client';
import { LeadsBaseAdapter } from './leads-base.adapter';

export class WhatsAppBusinessAdapter extends LeadsBaseAdapter {
  readonly key = IntegrationProviderKey.WHATSAPP_BUSINESS;
  readonly label = 'WhatsApp Business';
  readonly category = IntegrationCategory.MESSAGING;
  readonly description = 'Connect WhatsApp Business for messaging and lead capture.';
  readonly intakeProviderKey = 'whatsapp';
}
