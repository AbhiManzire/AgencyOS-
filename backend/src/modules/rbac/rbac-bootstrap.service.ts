import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RBAC_REPOSITORY, type RbacRepository } from './repositories/rbac.repository.interface';

interface PermissionSeedDefinition {
  readonly key: string;
  readonly name: string;
  readonly description: string;
  readonly module: string;
}

const PERMISSION_CATALOG_SEED: readonly PermissionSeedDefinition[] = [
  {
    key: 'dashboard.read',
    name: 'View Dashboard',
    description: 'Access the executive dashboard.',
    module: 'dashboard',
  },
  {
    key: 'reports.read',
    name: 'View Reports',
    description: 'Access founder operational reports and CSV export.',
    module: 'reports',
  },
  {
    key: 'settings.read',
    name: 'View Settings',
    description: 'View company, workspace, users, roles, and preferences.',
    module: 'settings',
  },
  {
    key: 'settings.update',
    name: 'Update Settings',
    description: 'Update company profile, workspace settings, preferences, and user roles.',
    module: 'settings',
  },
  {
    key: 'clients.read',
    name: 'View Clients',
    description: 'View client records in the workspace.',
    module: 'clients',
  },
  {
    key: 'clients.create',
    name: 'Create Clients',
    description: 'Create new client records.',
    module: 'clients',
  },
  {
    key: 'clients.update',
    name: 'Update Clients',
    description: 'Edit existing client records.',
    module: 'clients',
  },
  {
    key: 'clients.archive',
    name: 'Archive Clients',
    description: 'Archive client records.',
    module: 'clients',
  },
  {
    key: 'clients.restore',
    name: 'Restore Clients',
    description: 'Restore archived client records.',
    module: 'clients',
  },
  {
    key: 'clients.contacts.read',
    name: 'View Client Contacts',
    description: 'View contacts on client records.',
    module: 'clients',
  },
  {
    key: 'clients.contacts.manage',
    name: 'Manage Client Contacts',
    description: 'Create, update, and delete client contacts.',
    module: 'clients',
  },
  {
    key: 'projects.read',
    name: 'View Projects',
    description: 'View project records in the workspace.',
    module: 'projects',
  },
  {
    key: 'projects.create',
    name: 'Create Projects',
    description: 'Create new project records.',
    module: 'projects',
  },
  {
    key: 'projects.update',
    name: 'Update Projects',
    description: 'Edit existing project records.',
    module: 'projects',
  },
  {
    key: 'tasks.read',
    name: 'View Tasks',
    description: 'View task records in the workspace.',
    module: 'tasks',
  },
  {
    key: 'tasks.create',
    name: 'Create Tasks',
    description: 'Create new task records.',
    module: 'tasks',
  },
  {
    key: 'tasks.update',
    name: 'Update Tasks',
    description: 'Edit existing task records.',
    module: 'tasks',
  },
  {
    key: 'comments.read',
    name: 'View Comments',
    description: 'View comments on entities.',
    module: 'comments',
  },
  {
    key: 'comments.manage',
    name: 'Manage Comments',
    description: 'Create, update, and delete comments.',
    module: 'comments',
  },
  {
    key: 'files.read',
    name: 'View Files',
    description: 'View and download files attached to entities.',
    module: 'files',
  },
  {
    key: 'files.manage',
    name: 'Manage Files',
    description: 'Upload and delete files attached to entities.',
    module: 'files',
  },
  {
    key: 'time.read',
    name: 'View Time Entries',
    description: 'View logged time on tasks.',
    module: 'time',
  },
  {
    key: 'time.manage',
    name: 'Manage Time Entries',
    description: 'Create, update, and delete time entries.',
    module: 'time',
  },
  {
    key: 'sales.read',
    name: 'View Sales',
    description: 'View deals and sales pipeline.',
    module: 'sales',
  },
  {
    key: 'sales.create',
    name: 'Create Deals',
    description: 'Create new deal records.',
    module: 'sales',
  },
  {
    key: 'sales.update',
    name: 'Update Deals',
    description: 'Edit existing deal records and move pipeline stages.',
    module: 'sales',
  },
  {
    key: 'quotes.read',
    name: 'View Quotes',
    description: 'View sales quotes in the workspace.',
    module: 'sales',
  },
  {
    key: 'quotes.create',
    name: 'Create Quotes',
    description: 'Create new sales quotes.',
    module: 'sales',
  },
  {
    key: 'quotes.update',
    name: 'Update Quotes',
    description: 'Edit existing sales quotes.',
    module: 'sales',
  },
  {
    key: 'proposals.read',
    name: 'View Proposals',
    description: 'View sales proposals in the workspace.',
    module: 'sales',
  },
  {
    key: 'proposals.create',
    name: 'Create Proposals',
    description: 'Create new sales proposals.',
    module: 'sales',
  },
  {
    key: 'proposals.update',
    name: 'Update Proposals',
    description: 'Edit existing sales proposals.',
    module: 'sales',
  },
  {
    key: 'invoices.read',
    name: 'View Invoices',
    description: 'View invoices in the workspace.',
    module: 'finance',
  },
  {
    key: 'invoices.create',
    name: 'Create Invoices',
    description: 'Create new invoices.',
    module: 'finance',
  },
  {
    key: 'invoices.update',
    name: 'Update Invoices',
    description: 'Edit existing invoices.',
    module: 'finance',
  },
  {
    key: 'workflows.read',
    name: 'View Workflows',
    description: 'View automation workflows in the workspace.',
    module: 'settings',
  },
  {
    key: 'workflows.create',
    name: 'Create Workflows',
    description: 'Create new automation workflows.',
    module: 'settings',
  },
];

/** Ensures the platform permission catalog exists at startup. */
@Injectable()
export class RbacBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(RbacBootstrapService.name);

  constructor(
    @Inject(RBAC_REPOSITORY)
    private readonly rbacRepository: RbacRepository,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedPermissionCatalog();
  }

  /** Seeds default permissions and super-admin role for a tenant workspace fixture. */
  async seedTenantRbac(
    tenantId: string,
    userId: string,
    superAdminRoleSlug = 'super-admin',
  ): Promise<void> {
    const now = new Date();
    const catalog = await this.prisma.permission.findMany({
      where: { deletedAt: null },
      select: { id: true },
    });

    const superAdminRole = await this.rbacRepository.upsertSystemRole({
      id: randomUUID(),
      tenantId,
      name: 'Super Admin',
      slug: superAdminRoleSlug,
      description: 'Full workspace access with permission bypass.',
      now,
    });

    for (const permission of catalog) {
      await this.rbacRepository.ensureRolePermission(
        tenantId,
        superAdminRole.id,
        permission.id,
        now,
      );
    }

    await this.rbacRepository.ensureUserRoleAssignment(tenantId, userId, superAdminRole.id, now);
  }

  private async seedPermissionCatalog(): Promise<void> {
    const now = new Date();

    for (const definition of PERMISSION_CATALOG_SEED) {
      await this.rbacRepository.upsertPermissionCatalogEntry({
        id: randomUUID(),
        key: definition.key,
        name: definition.name,
        description: definition.description,
        module: definition.module,
        now,
      });
    }

    this.logger.log(
      `RBAC permission catalog synchronized (${String(PERMISSION_CATALOG_SEED.length)} keys).`,
    );
  }
}
