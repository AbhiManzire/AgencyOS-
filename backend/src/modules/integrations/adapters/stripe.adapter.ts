import { IntegrationCategory, IntegrationProviderKey } from '@prisma/client';
import { BaseAdapter } from './base.adapter';

export class StripeAdapter extends BaseAdapter {
  readonly key = IntegrationProviderKey.STRIPE;
  readonly label = 'Stripe';
  readonly category = IntegrationCategory.PAYMENTS;
  readonly description = 'Accept payments and sync Stripe payment events.';
}
