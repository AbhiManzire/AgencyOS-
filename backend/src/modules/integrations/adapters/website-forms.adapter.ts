import { IntegrationCategory, IntegrationProviderKey } from '@prisma/client';
import { LeadsBaseAdapter } from './leads-base.adapter';

export class WebsiteFormsAdapter extends LeadsBaseAdapter {
  readonly key = IntegrationProviderKey.WEBSITE_FORMS;
  readonly label = 'Website Forms';
  readonly category = IntegrationCategory.LEADS;
  readonly description = 'Ingest leads submitted through website contact forms.';
  readonly intakeProviderKey = 'website_forms';
}
