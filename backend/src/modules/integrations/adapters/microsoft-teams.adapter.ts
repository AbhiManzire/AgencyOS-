import { IntegrationCategory, IntegrationProviderKey } from '@prisma/client';
import { BaseAdapter } from './base.adapter';

export class MicrosoftTeamsAdapter extends BaseAdapter {
  readonly key = IntegrationProviderKey.MICROSOFT_TEAMS;
  readonly label = 'Microsoft Teams';
  readonly category = IntegrationCategory.COLLABORATION;
  readonly description = 'Send notifications and collaborate via Microsoft Teams.';
}
