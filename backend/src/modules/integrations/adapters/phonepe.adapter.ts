import { IntegrationCategory, IntegrationProviderKey } from '@prisma/client';
import { BaseAdapter } from './base.adapter';

export class PhonePeAdapter extends BaseAdapter {
  readonly key = IntegrationProviderKey.PHONEPE;
  readonly label = 'PhonePe';
  readonly category = IntegrationCategory.PAYMENTS;
  readonly description = 'Accept payments and sync PhonePe payment events.';
}
