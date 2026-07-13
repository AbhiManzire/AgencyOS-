import { IntegrationCategory, IntegrationProviderKey } from '@prisma/client';
import { BaseAdapter } from './base.adapter';

export class WebhookAdapter extends BaseAdapter {
  readonly key = IntegrationProviderKey.WEBHOOK;
  readonly label = 'Webhook';
  readonly category = IntegrationCategory.WEBHOOK;
  readonly description = 'Generic inbound/outbound webhook integration.';
}
