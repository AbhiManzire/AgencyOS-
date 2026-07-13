import { IntegrationCategory, IntegrationProviderKey } from '@prisma/client';
import type { IntegrationCatalogEntry } from '../domain/integration-domain.types';

/** Marketplace metadata for every Integration Hub provider. */
export const INTEGRATION_CATALOG: readonly IntegrationCatalogEntry[] = [
  {
    key: IntegrationProviderKey.META_LEAD_ADS,
    label: 'Meta Lead Ads',
    category: IntegrationCategory.LEADS,
    description: 'Receive leads from Meta (Facebook/Instagram) Lead Ads forms.',
  },
  {
    key: IntegrationProviderKey.GOOGLE_LEAD_FORMS,
    label: 'Google Lead Forms',
    category: IntegrationCategory.LEADS,
    description: 'Receive leads from Google Ads lead form extensions.',
  },
  {
    key: IntegrationProviderKey.GOOGLE_ADS,
    label: 'Google Ads',
    category: IntegrationCategory.ADS,
    description: 'Sync campaign performance and spend from Google Ads.',
  },
  {
    key: IntegrationProviderKey.GOOGLE_ANALYTICS,
    label: 'Google Analytics',
    category: IntegrationCategory.ANALYTICS,
    description: 'Pull analytics metrics from Google Analytics properties.',
  },
  {
    key: IntegrationProviderKey.WEBSITE_FORMS,
    label: 'Website Forms',
    category: IntegrationCategory.LEADS,
    description: 'Ingest leads submitted through website contact forms.',
  },
  {
    key: IntegrationProviderKey.WHATSAPP_BUSINESS,
    label: 'WhatsApp Business',
    category: IntegrationCategory.MESSAGING,
    description: 'Connect WhatsApp Business for messaging and lead capture.',
  },
  {
    key: IntegrationProviderKey.GMAIL,
    label: 'Gmail',
    category: IntegrationCategory.EMAIL,
    description: 'Send and sync email activity via Gmail.',
  },
  {
    key: IntegrationProviderKey.OUTLOOK,
    label: 'Outlook',
    category: IntegrationCategory.EMAIL,
    description: 'Send and sync email activity via Microsoft Outlook.',
  },
  {
    key: IntegrationProviderKey.STRIPE,
    label: 'Stripe',
    category: IntegrationCategory.PAYMENTS,
    description: 'Accept payments and sync Stripe payment events.',
  },
  {
    key: IntegrationProviderKey.RAZORPAY,
    label: 'Razorpay',
    category: IntegrationCategory.PAYMENTS,
    description: 'Accept payments and sync Razorpay payment events.',
  },
  {
    key: IntegrationProviderKey.PHONEPE,
    label: 'PhonePe',
    category: IntegrationCategory.PAYMENTS,
    description: 'Accept payments and sync PhonePe payment events.',
  },
  {
    key: IntegrationProviderKey.PAYPAL,
    label: 'PayPal',
    category: IntegrationCategory.PAYMENTS,
    description: 'Accept payments and sync PayPal payment events.',
  },
  {
    key: IntegrationProviderKey.TALLY,
    label: 'Tally',
    category: IntegrationCategory.ACCOUNTING,
    description: 'Sync accounting data with Tally.',
  },
  {
    key: IntegrationProviderKey.ZOHO_BOOKS,
    label: 'Zoho Books',
    category: IntegrationCategory.ACCOUNTING,
    description: 'Sync accounting data with Zoho Books.',
  },
  {
    key: IntegrationProviderKey.SLACK,
    label: 'Slack',
    category: IntegrationCategory.COLLABORATION,
    description: 'Send notifications and collaborate via Slack.',
  },
  {
    key: IntegrationProviderKey.MICROSOFT_TEAMS,
    label: 'Microsoft Teams',
    category: IntegrationCategory.COLLABORATION,
    description: 'Send notifications and collaborate via Microsoft Teams.',
  },
  {
    key: IntegrationProviderKey.WEBHOOK,
    label: 'Webhook',
    category: IntegrationCategory.WEBHOOK,
    description: 'Generic inbound/outbound webhook integration.',
  },
  {
    key: IntegrationProviderKey.REST_API,
    label: 'REST API',
    category: IntegrationCategory.CUSTOM,
    description: 'Generic REST API connector for custom endpoints.',
  },
  {
    key: IntegrationProviderKey.CUSTOM,
    label: 'Custom',
    category: IntegrationCategory.CUSTOM,
    description: 'Custom integration adapter for workspace-specific connectors.',
  },
] as const;

export function getCatalogEntry(key: IntegrationProviderKey): IntegrationCatalogEntry | undefined {
  return INTEGRATION_CATALOG.find((entry) => entry.key === key);
}
