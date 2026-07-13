import { IntegrationCategory, IntegrationProviderKey } from '@prisma/client';
import { LeadsBaseAdapter } from './leads-base.adapter';

export class MetaLeadAdsAdapter extends LeadsBaseAdapter {
  readonly key = IntegrationProviderKey.META_LEAD_ADS;
  readonly label = 'Meta Lead Ads';
  readonly category = IntegrationCategory.LEADS;
  readonly description = 'Receive leads from Meta (Facebook/Instagram) Lead Ads forms.';
  readonly intakeProviderKey = 'meta_lead_ads';
}
