import { IntegrationCategory, IntegrationProviderKey } from '@prisma/client';
import { BaseAdapter } from './base.adapter';

export class GoogleAnalyticsAdapter extends BaseAdapter {
  readonly key = IntegrationProviderKey.GOOGLE_ANALYTICS;
  readonly label = 'Google Analytics';
  readonly category = IntegrationCategory.ANALYTICS;
  readonly description = 'Pull analytics metrics from Google Analytics properties.';
}
