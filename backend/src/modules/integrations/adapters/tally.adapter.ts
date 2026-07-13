import { IntegrationCategory, IntegrationProviderKey } from '@prisma/client';
import { BaseAdapter } from './base.adapter';

export class TallyAdapter extends BaseAdapter {
  readonly key = IntegrationProviderKey.TALLY;
  readonly label = 'Tally';
  readonly category = IntegrationCategory.ACCOUNTING;
  readonly description = 'Sync accounting data with Tally.';
}
