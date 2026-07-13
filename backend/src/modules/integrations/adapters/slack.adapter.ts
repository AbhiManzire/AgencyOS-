import { IntegrationCategory, IntegrationProviderKey } from '@prisma/client';
import { BaseAdapter } from './base.adapter';

export class SlackAdapter extends BaseAdapter {
  readonly key = IntegrationProviderKey.SLACK;
  readonly label = 'Slack';
  readonly category = IntegrationCategory.COLLABORATION;
  readonly description = 'Send notifications and collaborate via Slack.';
}
