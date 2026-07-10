import type { ProjectStatus } from '@prisma/client';
import type {
  ClientRecord,
  ClientRepository,
  ClientScope,
} from '../../clients/repositories/client.repository.interface';
import type {
  ProjectRecord,
  ProjectRepository,
  ProjectScope,
} from '../repositories/project.repository.interface';
import { PROJECT_DOMAIN_ERROR_CODES, ProjectDomainError } from './project-domain.errors';
import {
  PROJECT_CREATABLE_STATUSES,
  type CreateProjectValidationInput,
  type UpdateProjectValidationInput,
} from './project-domain.types';

const STATUS_TRANSITIONS: Readonly<Record<ProjectStatus, readonly ProjectStatus[]>> = {
  PLANNING: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['ON_HOLD', 'COMPLETED', 'CANCELLED'],
  ON_HOLD: ['ACTIVE', 'CANCELLED'],
  COMPLETED: ['INVOICE_READY'],
  INVOICE_READY: [],
  CANCELLED: [],
};

/**
 * Pure domain service for project business rules.
 * Framework-independent — no HTTP or NestJS dependencies.
 */
export class ProjectDomainService {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly clientRepository: ClientRepository,
  ) {}

  async validateCreate(scope: ProjectScope, input: CreateProjectValidationInput): Promise<void> {
    this.assertScopeAlignment(scope, input.tenantId, input.workspaceId);
    this.assertNameRequired(input.name);

    const status = input.status ?? 'PLANNING';
    this.assertCreatableStatus(status);
    this.assertDateRange(input.startDate, input.targetEndDate);

    await this.assertClientEligible(scope, input.clientId);

    if (input.code !== undefined && input.code !== null) {
      await this.assertCodeAvailable(scope, input.code);
    }
  }

  async validateUpdate(
    scope: ProjectScope,
    project: ProjectRecord,
    input: UpdateProjectValidationInput,
  ): Promise<void> {
    this.ensureWorkspaceOwnership(scope, project);
    this.assertProjectIsActive(project);

    if (input.name !== undefined) {
      this.assertNameRequired(input.name);
    }

    if (input.status !== undefined) {
      this.assertValidStatus(input.status);
      this.assertStatusTransition(project.status, input.status);
    }

    const startDate = input.startDate !== undefined ? input.startDate : project.startDate;
    const targetEndDate =
      input.targetEndDate !== undefined ? input.targetEndDate : project.targetEndDate;
    this.assertDateRange(startDate, targetEndDate);

    if (input.code !== undefined && input.code !== null) {
      await this.assertCodeAvailable(scope, input.code, project.id);
    }
  }

  ensureWorkspaceOwnership(scope: ProjectScope, project: ProjectRecord): void {
    if (project.tenantId !== scope.tenantId || project.workspaceId !== scope.workspaceId) {
      throw new ProjectDomainError(
        PROJECT_DOMAIN_ERROR_CODES.WORKSPACE_OWNERSHIP_MISMATCH,
        'Project does not belong to the requested workspace.',
      );
    }
  }

  validateArchive(scope: ProjectScope, project: ProjectRecord): void {
    this.ensureWorkspaceOwnership(scope, project);
    this.assertProjectIsActive(project);
  }

  validateRestore(scope: ProjectScope, project: ProjectRecord): void {
    this.ensureWorkspaceOwnership(scope, project);

    if (project.deletedAt === null) {
      throw new ProjectDomainError(
        PROJECT_DOMAIN_ERROR_CODES.INVALID_STATUS,
        'Project is not archived.',
      );
    }
  }

  validateComplete(scope: ProjectScope, project: ProjectRecord): void {
    this.ensureWorkspaceOwnership(scope, project);
    this.assertProjectIsActive(project);
    this.assertStatusTransition(project.status, 'COMPLETED');
  }

  validateInvoiceReady(scope: ProjectScope, project: ProjectRecord): void {
    this.ensureWorkspaceOwnership(scope, project);
    this.assertProjectIsActive(project);
    this.assertStatusTransition(project.status, 'INVOICE_READY');

    if (!project.isBillable) {
      throw new ProjectDomainError(
        PROJECT_DOMAIN_ERROR_CODES.INVALID_STATUS_TRANSITION,
        'Only billable projects can be marked invoice ready.',
      );
    }
  }

  private assertScopeAlignment(scope: ProjectScope, tenantId: string, workspaceId: string): void {
    if (scope.tenantId !== tenantId || scope.workspaceId !== workspaceId) {
      throw new ProjectDomainError(
        PROJECT_DOMAIN_ERROR_CODES.TENANT_SCOPE_MISMATCH,
        'Project data must match the active tenant and workspace scope.',
      );
    }
  }

  private assertNameRequired(name: string): void {
    if (name.trim().length === 0) {
      throw new ProjectDomainError(
        PROJECT_DOMAIN_ERROR_CODES.PROJECT_NAME_REQUIRED,
        'Project name is required.',
      );
    }
  }

  private assertCreatableStatus(status: ProjectStatus): void {
    if (!PROJECT_CREATABLE_STATUSES.includes(status)) {
      throw new ProjectDomainError(
        PROJECT_DOMAIN_ERROR_CODES.INVALID_STATUS,
        `Status "${status}" is not allowed when creating a project.`,
      );
    }
  }

  private assertValidStatus(status: ProjectStatus): void {
    if (!isProjectStatus(status)) {
      throw new ProjectDomainError(
        PROJECT_DOMAIN_ERROR_CODES.INVALID_STATUS,
        `Status "${String(status)}" is not a valid project lifecycle state.`,
      );
    }
  }

  private assertStatusTransition(from: ProjectStatus, to: ProjectStatus): void {
    if (from === to) {
      return;
    }

    const allowed = STATUS_TRANSITIONS[from];
    if (!allowed.includes(to)) {
      throw new ProjectDomainError(
        PROJECT_DOMAIN_ERROR_CODES.INVALID_STATUS_TRANSITION,
        `Cannot transition project status from "${from}" to "${to}".`,
      );
    }
  }

  private assertDateRange(startDate?: Date | null, targetEndDate?: Date | null): void {
    if (
      startDate === undefined ||
      startDate === null ||
      targetEndDate === undefined ||
      targetEndDate === null
    ) {
      return;
    }

    if (targetEndDate.getTime() < startDate.getTime()) {
      throw new ProjectDomainError(
        PROJECT_DOMAIN_ERROR_CODES.INVALID_DATE_RANGE,
        'Target end date must be on or after the start date.',
      );
    }
  }

  private assertProjectIsActive(project: ProjectRecord): void {
    if (project.deletedAt !== null) {
      throw new ProjectDomainError(
        PROJECT_DOMAIN_ERROR_CODES.PROJECT_ARCHIVED,
        'Project is archived and cannot be modified.',
      );
    }
  }

  private async assertClientEligible(scope: ClientScope, clientId: string): Promise<void> {
    const client = await this.clientRepository.findById(scope, clientId, {
      includeArchived: true,
    });

    if (client === null) {
      throw new ProjectDomainError(
        PROJECT_DOMAIN_ERROR_CODES.CLIENT_NOT_FOUND,
        'Client was not found.',
      );
    }

    this.assertClientIsActive(client);
  }

  private assertClientIsActive(client: ClientRecord): void {
    if (client.deletedAt !== null) {
      throw new ProjectDomainError(
        PROJECT_DOMAIN_ERROR_CODES.CLIENT_ARCHIVED,
        'Client is archived and cannot be linked to new or updated projects.',
      );
    }
  }

  private async assertCodeAvailable(
    scope: ProjectScope,
    code: string,
    excludeProjectId?: string,
  ): Promise<void> {
    const normalized = code.trim();
    if (normalized.length === 0) {
      return;
    }

    const existing = await this.projectRepository.findByCode(scope, normalized);
    if (existing !== null && existing.id !== excludeProjectId) {
      throw new ProjectDomainError(
        PROJECT_DOMAIN_ERROR_CODES.PROJECT_CODE_NOT_UNIQUE,
        'Project code is already in use by another active project in this workspace.',
      );
    }
  }
}

function isProjectStatus(value: string): value is ProjectStatus {
  return (
    value === 'PLANNING' ||
    value === 'ACTIVE' ||
    value === 'ON_HOLD' ||
    value === 'COMPLETED' ||
    value === 'INVOICE_READY' ||
    value === 'CANCELLED'
  );
}
