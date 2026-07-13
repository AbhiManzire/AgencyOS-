import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  LEAD_INTAKE_PROVIDERS,
  type LeadIntakeProvider,
  type LeadIntakeProviderSummary,
} from './lead-intake.types';

@Injectable()
export class LeadIntakeRegistry {
  private readonly providersByKey: ReadonlyMap<string, LeadIntakeProvider>;

  constructor(
    @Inject(LEAD_INTAKE_PROVIDERS)
    providers: readonly LeadIntakeProvider[],
  ) {
    const map = new Map<string, LeadIntakeProvider>();
    for (const provider of providers) {
      if (map.has(provider.key)) {
        throw new Error(`Duplicate lead intake provider key: ${provider.key}`);
      }
      map.set(provider.key, provider);
    }
    this.providersByKey = map;
  }

  getOrThrow(key: string): LeadIntakeProvider {
    const provider = this.providersByKey.get(key);
    if (provider === undefined) {
      throw new BadRequestException(`Unknown lead intake provider: ${key}`);
    }
    return provider;
  }

  list(): readonly LeadIntakeProviderSummary[] {
    return [...this.providersByKey.values()].map((provider) => ({
      key: provider.key,
      label: provider.label,
      defaultSource: provider.defaultSource,
    }));
  }
}
