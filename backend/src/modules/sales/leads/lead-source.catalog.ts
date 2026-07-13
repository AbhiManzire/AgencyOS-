export const LEAD_SOURCE_CATALOG = [
  { value: 'MANUAL', label: 'Manual', enabled: true },
  { value: 'WEBSITE', label: 'Website', enabled: true },
  { value: 'META_ADS', label: 'Meta Ads', enabled: true },
  { value: 'GOOGLE_ADS', label: 'Google Ads', enabled: true },
  { value: 'WHATSAPP', label: 'WhatsApp', enabled: true },
  { value: 'EMAIL', label: 'Email', enabled: true },
  { value: 'CALL', label: 'Call', enabled: true },
  { value: 'REFERRAL', label: 'Referral', enabled: true },
  { value: 'IMPORT', label: 'Import', enabled: true },
  { value: 'API', label: 'API', enabled: true },
  { value: 'WEBHOOK', label: 'Webhook', enabled: true },
] as const;

export type LeadSourceCatalogEntry = (typeof LEAD_SOURCE_CATALOG)[number];
