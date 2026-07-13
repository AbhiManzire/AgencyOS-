import { IntegrationCategory, IntegrationProviderKey } from '@prisma/client';
import { BaseAdapter } from './base.adapter';

export class PayPalAdapter extends BaseAdapter {
  readonly key = IntegrationProviderKey.PAYPAL;
  readonly label = 'PayPal';
  readonly category = IntegrationCategory.PAYMENTS;
  readonly description = 'Accept payments and sync PayPal payment events.';
}
