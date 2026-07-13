import { IntegrationCategory, IntegrationProviderKey } from '@prisma/client';
import { BaseAdapter } from './base.adapter';

export class OutlookAdapter extends BaseAdapter {
  readonly key = IntegrationProviderKey.OUTLOOK;
  readonly label = 'Outlook';
  readonly category = IntegrationCategory.EMAIL;
  readonly description = 'Send and sync email activity via Microsoft Outlook.';
}
