import { IntegrationCategory, IntegrationProviderKey } from '@prisma/client';
import { BaseAdapter } from './base.adapter';

export class CustomAdapter extends BaseAdapter {
  readonly key = IntegrationProviderKey.CUSTOM;
  readonly label = 'Custom';
  readonly category = IntegrationCategory.CUSTOM;
  readonly description = 'Custom integration adapter for workspace-specific connectors.';
}
