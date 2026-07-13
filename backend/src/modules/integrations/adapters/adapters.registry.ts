import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import type { IntegrationProviderKey } from '@prisma/client';
import {
  INTEGRATION_DOMAIN_ERROR_CODES,
  IntegrationDomainError,
} from '../domain/integration-domain.errors';
import type { IntegrationCatalogEntry } from '../domain/integration-domain.types';
import { INTEGRATION_CATALOG } from './catalog';
import { CustomAdapter } from './custom.adapter';
import { GmailAdapter } from './gmail.adapter';
import { GoogleAdsAdapter } from './google-ads.adapter';
import { GoogleAnalyticsAdapter } from './google-analytics.adapter';
import { GoogleLeadFormsAdapter } from './google-lead-forms.adapter';
import type { IntegrationAdapter } from './integration-adapter.interface';
import { MetaLeadAdsAdapter } from './meta-lead-ads.adapter';
import { MicrosoftTeamsAdapter } from './microsoft-teams.adapter';
import { OutlookAdapter } from './outlook.adapter';
import { PayPalAdapter } from './paypal.adapter';
import { PhonePeAdapter } from './phonepe.adapter';
import { RazorpayAdapter } from './razorpay.adapter';
import { RestApiAdapter } from './rest-api.adapter';
import { SlackAdapter } from './slack.adapter';
import { StripeAdapter } from './stripe.adapter';
import { TallyAdapter } from './tally.adapter';
import { WebhookAdapter } from './webhook.adapter';
import { WebsiteFormsAdapter } from './website-forms.adapter';
import { WhatsAppBusinessAdapter } from './whatsapp-business.adapter';
import { ZohoBooksAdapter } from './zoho-books.adapter';

@Injectable()
export class AdaptersRegistry {
  private readonly adaptersByKey: ReadonlyMap<IntegrationProviderKey, IntegrationAdapter>;

  constructor(moduleRef: ModuleRef) {
    const adapters: IntegrationAdapter[] = [
      new MetaLeadAdsAdapter(moduleRef),
      new GoogleLeadFormsAdapter(moduleRef),
      new GoogleAdsAdapter(),
      new GoogleAnalyticsAdapter(),
      new WebsiteFormsAdapter(moduleRef),
      new WhatsAppBusinessAdapter(moduleRef),
      new GmailAdapter(),
      new OutlookAdapter(),
      new StripeAdapter(),
      new RazorpayAdapter(),
      new PhonePeAdapter(),
      new PayPalAdapter(),
      new TallyAdapter(),
      new ZohoBooksAdapter(),
      new SlackAdapter(),
      new MicrosoftTeamsAdapter(),
      new WebhookAdapter(),
      new RestApiAdapter(),
      new CustomAdapter(),
    ];

    const map = new Map<IntegrationProviderKey, IntegrationAdapter>();
    for (const adapter of adapters) {
      if (map.has(adapter.key)) {
        throw new Error(`Duplicate integration adapter key: ${adapter.key}`);
      }
      map.set(adapter.key, adapter);
    }
    this.adaptersByKey = map;
  }

  listCatalog(): readonly IntegrationCatalogEntry[] {
    return INTEGRATION_CATALOG;
  }

  getOrThrow(key: IntegrationProviderKey): IntegrationAdapter {
    const adapter = this.adaptersByKey.get(key);
    if (adapter === undefined) {
      throw new IntegrationDomainError(
        INTEGRATION_DOMAIN_ERROR_CODES.PROVIDER_NOT_FOUND,
        `Integration provider adapter was not found: ${key}`,
      );
    }
    return adapter;
  }

  listAdapters(): readonly IntegrationAdapter[] {
    return [...this.adaptersByKey.values()];
  }
}
