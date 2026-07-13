import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_SYSTEM_ROLE_SLUGS, type DefaultSystemRoleSlug } from './rbac.constants';
import { RBAC_REPOSITORY, type RbacRepository } from './repositories/rbac.repository.interface';

interface PermissionSeedDefinition {
  readonly key: string;
  readonly name: string;
  readonly description: string;
  readonly module: string;
}

interface SystemRoleSeedDefinition {
  readonly slug: DefaultSystemRoleSlug;
  readonly name: string;
  readonly description: string;
  /** Exact keys, prefix patterns (`sales.*`), or suffix patterns (`*.read`). Empty = all catalog keys. */
  readonly permissionPatterns: readonly string[];
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
    description: 'Access reports, analytics, exports, and scheduled report delivery.',
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
    key: 'settings.export',
    name: 'Export Settings',
    description: 'Export workspace configuration and settings data.',
    module: 'settings',
  },
  {
    key: 'users.manage',
    name: 'Manage Users',
    description: 'Invite, deactivate, reactivate, archive, and update workspace users.',
    module: 'settings',
  },
  {
    key: 'roles.manage',
    name: 'Manage Roles',
    description: 'Create, update, delete custom roles and assign permissions.',
    module: 'settings',
  },
  {
    key: 'audit.read',
    name: 'View Audit Logs',
    description: 'View platform audit log entries.',
    module: 'admin',
  },
  {
    key: 'notifications.read',
    name: 'View Notifications',
    description: 'View in-app notifications.',
    module: 'notifications',
  },
  {
    key: 'notifications.manage',
    name: 'Manage Notifications',
    description: 'Manage notification delivery and preferences.',
    module: 'notifications',
  },
  {
    key: 'security.manage',
    name: 'Manage Security',
    description: 'Manage security settings, locks, and access tokens.',
    module: 'admin',
  },
  {
    key: 'admin.system',
    name: 'System Administration',
    description: 'Perform privileged platform administration actions.',
    module: 'admin',
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
    key: 'finance.vendors.read',
    name: 'View Vendors',
    description: 'View vendor records in the workspace.',
    module: 'finance',
  },
  {
    key: 'finance.vendors.create',
    name: 'Create Vendors',
    description: 'Create new vendor records.',
    module: 'finance',
  },
  {
    key: 'finance.vendors.update',
    name: 'Update Vendors',
    description: 'Edit existing vendor records.',
    module: 'finance',
  },
  {
    key: 'finance.expenses.read',
    name: 'View Expenses',
    description: 'View expense records in the workspace.',
    module: 'finance',
  },
  {
    key: 'finance.expenses.create',
    name: 'Create Expenses',
    description: 'Create new expense records.',
    module: 'finance',
  },
  {
    key: 'finance.expenses.update',
    name: 'Update Expenses',
    description: 'Edit existing expense records.',
    module: 'finance',
  },
  {
    key: 'finance.purchases.read',
    name: 'View Purchases',
    description: 'View purchase bills and payments.',
    module: 'finance',
  },
  {
    key: 'finance.purchases.create',
    name: 'Create Purchases',
    description: 'Create purchase bills and payments.',
    module: 'finance',
  },
  {
    key: 'finance.purchases.update',
    name: 'Update Purchases',
    description: 'Edit purchase bills and payments.',
    module: 'finance',
  },
  {
    key: 'finance.credit_notes.read',
    name: 'View Credit Notes',
    description: 'View credit notes in the workspace.',
    module: 'finance',
  },
  {
    key: 'finance.credit_notes.create',
    name: 'Create Credit Notes',
    description: 'Create new credit notes.',
    module: 'finance',
  },
  {
    key: 'finance.credit_notes.update',
    name: 'Update Credit Notes',
    description: 'Edit existing credit notes.',
    module: 'finance',
  },
  {
    key: 'finance.ledger.read',
    name: 'View Ledger',
    description: 'View ledger entries in the workspace.',
    module: 'finance',
  },
  {
    key: 'finance.recurring.read',
    name: 'View Recurring Finance',
    description: 'View recurring invoices and expenses.',
    module: 'finance',
  },
  {
    key: 'finance.recurring.create',
    name: 'Create Recurring Finance',
    description: 'Create recurring invoices and expenses.',
    module: 'finance',
  },
  {
    key: 'finance.recurring.update',
    name: 'Update Recurring Finance',
    description: 'Edit recurring invoices and expenses.',
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
  {
    key: 'workflows.update',
    name: 'Update Workflows',
    description: 'Update, enable, disable, and archive automation workflows.',
    module: 'settings',
  },
  {
    key: 'ai.read',
    name: 'View AI Settings',
    description: 'View AI settings, feature flags, prompts, conversations, and usage.',
    module: 'ai',
  },
  {
    key: 'ai.manage',
    name: 'Manage AI',
    description: 'Configure AI providers, settings, feature flags, and prompt templates.',
    module: 'ai',
  },
  {
    key: 'integrations.read',
    name: 'View Integrations',
    description: 'View Integration Hub catalog, connections, health, sync logs, and webhooks.',
    module: 'integrations',
  },
  {
    key: 'integrations.manage',
    name: 'Manage Integrations',
    description: 'Connect, disconnect, sync, and configure Integration Hub providers and webhooks.',
    module: 'integrations',
  },
];

const SYSTEM_ROLE_SEEDS: readonly SystemRoleSeedDefinition[] = [
  {
    slug: 'super-admin',
    name: 'Super Admin',
    description: 'Full workspace access with permission bypass.',
    permissionPatterns: [],
  },
  {
    slug: 'founder',
    name: 'Founder',
    description: 'Full tenant access equivalent to super-admin.',
    permissionPatterns: [],
  },
  {
    slug: 'admin',
    name: 'Admin',
    description: 'Full workspace administration access.',
    permissionPatterns: [],
  },
  {
    slug: 'manager',
    name: 'Manager',
    description: 'Operational oversight across clients, projects, tasks, sales, and reports.',
    permissionPatterns: [
      'dashboard.read',
      'clients.*',
      'projects.*',
      'tasks.*',
      'sales.read',
      'sales.update',
      'reports.read',
      'settings.read',
      'integrations.read',
      'integrations.manage',
    ],
  },
  {
    slug: 'sales',
    name: 'Sales',
    description: 'Sales pipeline, quotes, proposals, and client visibility.',
    permissionPatterns: ['sales.*', 'quotes.*', 'proposals.*', 'clients.read', 'dashboard.read'],
  },
  {
    slug: 'finance',
    name: 'Finance',
    description: 'Invoices, finance modules, payments, and reporting.',
    permissionPatterns: [
      'invoices.*',
      'finance.*',
      'reports.read',
      'dashboard.read',
      'integrations.read',
    ],
  },
  {
    slug: 'project-manager',
    name: 'Project Manager',
    description: 'Projects, tasks, time tracking, and related reporting.',
    permissionPatterns: [
      'projects.*',
      'tasks.*',
      'clients.read',
      'time.*',
      'dashboard.read',
      'reports.read',
    ],
  },
  {
    slug: 'developer',
    name: 'Developer',
    description: 'Task execution with project and time visibility.',
    permissionPatterns: [
      'tasks.*',
      'projects.read',
      'time.*',
      'comments.*',
      'files.*',
      'dashboard.read',
    ],
  },
  {
    slug: 'designer',
    name: 'Designer',
    description: 'Task execution with project and time visibility.',
    permissionPatterns: [
      'tasks.*',
      'projects.read',
      'time.*',
      'comments.*',
      'files.*',
      'dashboard.read',
    ],
  },
  {
    slug: 'qa',
    name: 'QA',
    description: 'Task and project visibility for quality assurance.',
    permissionPatterns: ['tasks.*', 'projects.read', 'dashboard.read'],
  },
  {
    slug: 'support',
    name: 'Support',
    description: 'Client visibility with task read and update access.',
    permissionPatterns: ['clients.read', 'tasks.read', 'tasks.update', 'dashboard.read'],
  },
  {
    slug: 'client',
    name: 'Client',
    description: 'Limited client-facing visibility.',
    permissionPatterns: ['clients.read'],
  },
  {
    slug: 'viewer',
    name: 'Viewer',
    description: 'Read-only access across modules.',
    permissionPatterns: ['*.read'],
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

  /** Seeds default permissions and system roles for a tenant workspace fixture. */
  async seedTenantRbac(
    tenantId: string,
    userId: string,
    superAdminRoleSlug = 'super-admin',
  ): Promise<void> {
    const now = new Date();
    await this.seedDefaultSystemRoles(tenantId, now);

    const superAdminRole = await this.rbacRepository.upsertSystemRole({
      id: randomUUID(),
      tenantId,
      name: 'Super Admin',
      slug: superAdminRoleSlug,
      description: 'Full workspace access with permission bypass.',
      now,
    });

    const catalog = await this.prisma.permission.findMany({
      where: { deletedAt: null },
      select: { id: true },
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

  /** Seeds DEFAULT_SYSTEM_ROLE_SLUGS with permission subsets for a tenant. */
  async seedDefaultSystemRoles(tenantId: string, now = new Date()): Promise<void> {
    const catalog = await this.prisma.permission.findMany({
      where: { deletedAt: null },
      select: { id: true, key: true },
    });
    const catalogKeys = catalog.map((entry) => entry.key);
    const permissionIdByKey = new Map(catalog.map((entry) => [entry.key, entry.id]));

    for (const definition of SYSTEM_ROLE_SEEDS) {
      if (!(DEFAULT_SYSTEM_ROLE_SLUGS as readonly string[]).includes(definition.slug)) {
        continue;
      }

      const role = await this.rbacRepository.upsertSystemRole({
        id: randomUUID(),
        tenantId,
        name: definition.name,
        slug: definition.slug,
        description: definition.description,
        now,
      });

      const matchedKeys =
        definition.permissionPatterns.length === 0
          ? catalogKeys
          : matchPermissionKeys(catalogKeys, definition.permissionPatterns);

      await this.rbacRepository.setRolePermissions(
        tenantId,
        role.id,
        matchedKeys
          .map((key) => permissionIdByKey.get(key))
          .filter((id): id is string => id !== undefined),
        now,
      );
    }
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

function matchPermissionKeys(
  catalogKeys: readonly string[],
  patterns: readonly string[],
): string[] {
  const matched = new Set<string>();

  for (const pattern of patterns) {
    if (pattern.endsWith('.*')) {
      const prefix = pattern.slice(0, -1);
      for (const key of catalogKeys) {
        if (key.startsWith(prefix) || key === pattern.slice(0, -2)) {
          matched.add(key);
        }
      }
      continue;
    }

    if (pattern.startsWith('*.')) {
      const suffix = pattern.slice(1);
      for (const key of catalogKeys) {
        if (key.endsWith(suffix)) {
          matched.add(key);
        }
      }
      continue;
    }

    if (catalogKeys.includes(pattern)) {
      matched.add(pattern);
    }
  }

  return [...matched].sort();
}

export { DEFAULT_SYSTEM_ROLE_SLUGS };
