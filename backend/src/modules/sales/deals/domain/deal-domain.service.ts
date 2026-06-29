import type { DealStage } from '@prisma/client';
import {
  type ClientContactRepository,
  type ClientContactScope,
} from '../../../clients/repositories/client-contact.repository.interface';
import {
  type ClientRepository,
  type ClientScope,
} from '../../../clients/repositories/client.repository.interface';
import type { DealRecord, DealScope } from '../repositories/deal.repository.interface';
import { DEAL_DOMAIN_ERROR_CODES, DealDomainError } from './deal-domain.errors';
import type { CreateDealValidationInput, UpdateDealValidationInput } from './deal-domain.types';

const VALID_STAGES: readonly DealStage[] = [
  'NEW',
  'QUALIFIED',
  'PROPOSAL',
  'NEGOTIATION',
  'WON',
  'LOST',
];

export class DealDomainService {
  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly clientContactRepository: ClientContactRepository,
  ) {}

  validateCreate(input: CreateDealValidationInput): void {
    this.assertTitleRequired(input.title);
    this.assertValueValid(input.value);

    if (input.stage !== undefined) {
      this.assertStageValid(input.stage);
    }
  }

  validateUpdate(deal: DealRecord, input: UpdateDealValidationInput): void {
    this.assertDealIsActive(deal);

    if (input.title !== undefined) {
      this.assertTitleRequired(input.title);
    }

    if (input.value !== undefined) {
      this.assertValueValid(input.value);
    }

    if (input.stage !== undefined) {
      this.assertStageValid(input.stage);
    }
  }

  async validateClient(scope: ClientScope, clientId: string): Promise<void> {
    const client = await this.clientRepository.findById(scope, clientId);

    if (client?.deletedAt != null || client == null) {
      throw new DealDomainError(DEAL_DOMAIN_ERROR_CODES.CLIENT_NOT_FOUND, 'Client was not found.');
    }
  }

  async validateContact(scope: ClientScope, clientId: string, contactId: string): Promise<void> {
    const contactScope: ClientContactScope = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      clientId,
    };
    const contact = await this.clientContactRepository.findById(contactScope, contactId);

    if (contact?.deletedAt != null || contact == null) {
      throw new DealDomainError(
        DEAL_DOMAIN_ERROR_CODES.CONTACT_NOT_FOUND,
        'Contact was not found.',
      );
    }

    if (contact.clientId !== clientId) {
      throw new DealDomainError(
        DEAL_DOMAIN_ERROR_CODES.CONTACT_CLIENT_MISMATCH,
        'Contact does not belong to the selected client.',
      );
    }
  }

  ensureWorkspaceOwnership(scope: DealScope, deal: DealRecord): void {
    if (deal.tenantId !== scope.tenantId || deal.workspaceId !== scope.workspaceId) {
      throw new DealDomainError(
        DEAL_DOMAIN_ERROR_CODES.WORKSPACE_OWNERSHIP_MISMATCH,
        'Deal does not belong to the requested workspace.',
      );
    }
  }

  normalizeTitle(title: string): string {
    return title.trim();
  }

  private assertTitleRequired(title: string): void {
    if (title.trim().length === 0) {
      throw new DealDomainError(DEAL_DOMAIN_ERROR_CODES.TITLE_REQUIRED, 'Deal title is required.');
    }
  }

  private assertValueValid(value: number): void {
    if (!Number.isFinite(value) || value < 0) {
      throw new DealDomainError(
        DEAL_DOMAIN_ERROR_CODES.INVALID_VALUE,
        'Deal value must be a non-negative number.',
      );
    }
  }

  private assertStageValid(stage: DealStage): void {
    if (!VALID_STAGES.includes(stage)) {
      throw new DealDomainError(DEAL_DOMAIN_ERROR_CODES.INVALID_STAGE, 'Deal stage is invalid.');
    }
  }

  private assertDealIsActive(deal: DealRecord): void {
    if (deal.deletedAt !== null) {
      throw new DealDomainError(
        DEAL_DOMAIN_ERROR_CODES.DEAL_ARCHIVED,
        'Deal is archived and cannot be modified.',
      );
    }
  }
}
