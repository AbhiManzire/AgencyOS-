import { IntegrationCategory, IntegrationProviderKey } from '@prisma/client';
import { BaseAdapter } from './base.adapter';

export class RestApiAdapter extends BaseAdapter {
  readonly key = IntegrationProviderKey.REST_API;
  readonly label = 'REST API';
  readonly category = IntegrationCategory.CUSTOM;
  readonly description = 'Generic REST API connector for custom endpoints.';
}
