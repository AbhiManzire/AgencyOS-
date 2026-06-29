import { Inject, Injectable } from '@nestjs/common';
import { RBAC_REPOSITORY, type RbacRepository } from '../repositories/rbac.repository.interface';
import type { PermissionCatalogEntry, RoleRecord } from '../rbac.types';

@Injectable()
export class RoleService {
  constructor(
    @Inject(RBAC_REPOSITORY)
    private readonly rbacRepository: RbacRepository,
  ) {}

  async listRoles(tenantId: string): Promise<readonly RoleRecord[]> {
    return this.rbacRepository.listRoles(tenantId);
  }

  async listPermissionCatalog(): Promise<readonly PermissionCatalogEntry[]> {
    return this.rbacRepository.listPermissionCatalog();
  }
}
