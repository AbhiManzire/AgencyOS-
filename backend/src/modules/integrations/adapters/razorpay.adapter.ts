import { IntegrationCategory, IntegrationProviderKey } from '@prisma/client';
import { BaseAdapter } from './base.adapter';

export class RazorpayAdapter extends BaseAdapter {
  readonly key = IntegrationProviderKey.RAZORPAY;
  readonly label = 'Razorpay';
  readonly category = IntegrationCategory.PAYMENTS;
  readonly description = 'Accept payments and sync Razorpay payment events.';
}
