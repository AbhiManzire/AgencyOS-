import type { ModuleRef } from '@nestjs/core';
import { LeadIntakeRegistry } from '../../sales/lead-intake/lead-intake.registry';
import { BaseAdapter, summarizePayload } from './base.adapter';
import type { AdapterContext, AdapterReceiveResult } from './integration-adapter.interface';

/**
 * Optionally delegates LEADS receive normalization to LeadIntakeRegistry
 * when SalesModule is loaded in the same app. Avoids hard module coupling.
 */
export abstract class LeadsBaseAdapter extends BaseAdapter {
  constructor(protected readonly moduleRef?: ModuleRef) {
    super();
  }

  abstract readonly intakeProviderKey: string;

  override receive(_ctx: AdapterContext, payload: unknown): Promise<AdapterReceiveResult> {
    const normalized = this.tryNormalizeViaLeadIntake(payload);
    return Promise.resolve({
      accepted: true,
      normalized: normalized ?? payload,
      mode: 'architecture',
      details: {
        providerKey: this.key,
        intakeProviderKey: this.intakeProviderKey,
        leadIntakeUsed: normalized !== null,
        payloadSummary: summarizePayload(payload),
      },
    });
  }

  /** Returns normalized payload, or `null` when lead-intake is unavailable. */
  private tryNormalizeViaLeadIntake(payload: unknown): unknown {
    if (this.moduleRef === undefined) {
      return null;
    }

    try {
      const registry = this.moduleRef.get(LeadIntakeRegistry, { strict: false });
      return registry.getOrThrow(this.intakeProviderKey).normalize(payload);
    } catch {
      return null;
    }
  }
}
