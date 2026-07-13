import { IntegrationCategory, IntegrationProviderKey } from '@prisma/client';
import { BaseAdapter } from './base.adapter';

export class GoogleAdsAdapter extends BaseAdapter {
  readonly key = IntegrationProviderKey.GOOGLE_ADS;
  readonly label = 'Google Ads';
  readonly category = IntegrationCategory.ADS;
  readonly description = 'Sync campaign performance and spend from Google Ads.';
}
