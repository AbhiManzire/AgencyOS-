import { IntegrationCategory, IntegrationProviderKey } from '@prisma/client';
import { LeadsBaseAdapter } from './leads-base.adapter';

export class GoogleLeadFormsAdapter extends LeadsBaseAdapter {
  readonly key = IntegrationProviderKey.GOOGLE_LEAD_FORMS;
  readonly label = 'Google Lead Forms';
  readonly category = IntegrationCategory.LEADS;
  readonly description = 'Receive leads from Google Ads lead form extensions.';
  readonly intakeProviderKey = 'google_lead_forms';
}
