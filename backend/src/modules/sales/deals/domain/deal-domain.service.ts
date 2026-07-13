import type { DealForecastCategory, DealPriority, DealStage, DealStatus } from '@prisma/client';
import { DEAL_STAGE_DEFAULT_PROBABILITY } from '../../pipelines/domain/default-pipeline.catalog';
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
import type {
  ConvertToInvoiceValidationInput,
  CreateDealValidationInput,
  LoseDealValidationInput,
  UpdateDealValidationInput,
  WinDealValidationInput,
} from './deal-domain.types';
import { DEAL_OPEN_STAGES } from './deal-domain.types';

export const VALID_STAGES: readonly DealStage[] = [
  'QUALIFICATION',
  'DISCOVERY',
  'PROPOSAL',
  'NEGOTIATION',
  'VERBAL_COMMIT',
  'WON',
  'LOST',
  'ARCHIVED',
];

export const OPEN_STAGES: readonly DealStage[] = DEAL_OPEN_STAGES;
const VALID_PRIORITIES: readonly DealPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

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

    if (input.probability !== undefined && input.probability !== null) {
      this.assertProbabilityValid(input.probability);
    }

    if (input.priority !== undefined) {
      this.assertPriorityValid(input.priority);
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
      this.assertStageTransition(deal.stage, input.stage);
    }

    if (input.probability !== undefined && input.probability !== null) {
      this.assertProbabilityValid(input.probability);
    }

    if (input.priority !== undefined) {
      this.assertPriorityValid(input.priority);
    }
  }

  validateArchive(deal: DealRecord): void {
    this.assertDealIsActive(deal);
  }

  validateRestore(deal: DealRecord): void {
    if (deal.deletedAt === null && deal.stage !== 'ARCHIVED' && deal.status !== 'ARCHIVED') {
      throw new DealDomainError(DEAL_DOMAIN_ERROR_CODES.DEAL_NOT_ARCHIVED, 'Deal is not archived.');
    }
  }

  validateConvertToProject(deal: DealRecord): void {
    this.assertDealIsActive(deal);

    if (deal.convertedProjectId !== null) {
      throw new DealDomainError(
        DEAL_DOMAIN_ERROR_CODES.ALREADY_CONVERTED,
        'Deal has already been converted to a project.',
      );
    }
  }

  validateConvertToInvoice(deal: DealRecord, input: ConvertToInvoiceValidationInput): void {
    this.assertDealIsActive(deal);

    if (deal.stage !== 'WON' && deal.status !== 'WON') {
      throw new DealDomainError(
        DEAL_DOMAIN_ERROR_CODES.DEAL_NOT_WON,
        'Deal must be marked as Won before it can be converted to an invoice.',
      );
    }

    const projectId = input.projectId ?? deal.convertedProjectId;
    if (projectId === null || projectId.trim().length === 0) {
      throw new DealDomainError(
        DEAL_DOMAIN_ERROR_CODES.PROJECT_REQUIRED,
        'A project is required to convert this deal to an invoice.',
      );
    }
  }

  validateWin(deal: DealRecord, _input: WinDealValidationInput = {}): void {
    this.assertDealIsActive(deal);
    this.assertStageTransition(deal.stage, 'WON');
  }

  validateLose(deal: DealRecord, input: LoseDealValidationInput): void {
    this.assertDealIsActive(deal);
    this.assertStageTransition(deal.stage, 'LOST');

    if (input.lossReason.trim().length === 0) {
      throw new DealDomainError(
        DEAL_DOMAIN_ERROR_CODES.LOSS_REASON_REQUIRED,
        'A loss reason is required to mark a deal as lost.',
      );
    }
  }

  validateStageChange(deal: DealRecord, stage: DealStage): void {
    this.assertDealIsActive(deal);
    this.assertStageValid(stage);
    this.assertStageTransition(deal.stage, stage);
  }

  deriveStatus(stage: DealStage): DealStatus {
    switch (stage) {
      case 'WON':
        return 'WON';
      case 'LOST':
        return 'LOST';
      case 'ARCHIVED':
        return 'ARCHIVED';
      default:
        return 'OPEN';
    }
  }

  defaultProbability(stage: DealStage): number {
    return DEAL_STAGE_DEFAULT_PROBABILITY[stage];
  }

  defaultForecastCategory(stage: DealStage): DealForecastCategory {
    switch (stage) {
      case 'WON':
        return 'CLOSED';
      case 'LOST':
        return 'OMITTED';
      case 'VERBAL_COMMIT':
        return 'COMMIT';
      case 'PROPOSAL':
      case 'NEGOTIATION':
        return 'BEST_CASE';
      default:
        return 'PIPELINE';
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

  private assertProbabilityValid(probability: number): void {
    if (!Number.isFinite(probability) || probability < 0 || probability > 100) {
      throw new DealDomainError(
        DEAL_DOMAIN_ERROR_CODES.INVALID_PROBABILITY,
        'Deal probability must be an integer between 0 and 100.',
      );
    }
  }

  private assertPriorityValid(priority: DealPriority): void {
    if (!VALID_PRIORITIES.includes(priority)) {
      throw new DealDomainError(
        DEAL_DOMAIN_ERROR_CODES.INVALID_PRIORITY,
        'Deal priority is invalid.',
      );
    }
  }

  private assertStageTransition(from: DealStage, to: DealStage): void {
    if (from === to) {
      return;
    }

    if (!this.isTransitionAllowed(from, to)) {
      throw new DealDomainError(
        DEAL_DOMAIN_ERROR_CODES.INVALID_STAGE_TRANSITION,
        `Cannot transition deal stage from "${from}" to "${to}".`,
      );
    }
  }

  private isTransitionAllowed(from: DealStage, to: DealStage): boolean {
    if (from === 'ARCHIVED') {
      return false;
    }

    if (from === 'WON' || from === 'LOST') {
      return to === 'ARCHIVED';
    }

    // Open stages: free movement among open stages, or to WON/LOST/ARCHIVED
    if (OPEN_STAGES.includes(from)) {
      if (OPEN_STAGES.includes(to)) {
        return true;
      }
      return to === 'WON' || to === 'LOST' || to === 'ARCHIVED';
    }

    return false;
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
