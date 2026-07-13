import { IntegrationCategory, IntegrationProviderKey } from '@prisma/client';
import { BaseAdapter } from './base.adapter';

export class ZohoBooksAdapter extends BaseAdapter {
  readonly key = IntegrationProviderKey.ZOHO_BOOKS;
  readonly label = 'Zoho Books';
  readonly category = IntegrationCategory.ACCOUNTING;
  readonly description = 'Sync accounting data with Zoho Books.';
}
