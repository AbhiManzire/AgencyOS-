import { IntegrationCategory, IntegrationProviderKey } from '@prisma/client';
import { BaseAdapter } from './base.adapter';

export class GmailAdapter extends BaseAdapter {
  readonly key = IntegrationProviderKey.GMAIL;
  readonly label = 'Gmail';
  readonly category = IntegrationCategory.EMAIL;
  readonly description = 'Send and sync email activity via Gmail.';
}
