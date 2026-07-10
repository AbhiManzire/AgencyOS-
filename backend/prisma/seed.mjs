import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';

const DEPLOY_DEFAULT_TENANT_ID = '00000000-0000-4000-8000-000000000001';
const DEPLOY_DEFAULT_WORKSPACE_ID = '00000000-0000-4000-8000-000000000002';
const DEPLOY_DEFAULT_USER_ID = '00000000-0000-4000-8000-000000000003';
const DEPLOY_DEFAULT_AGENCY_ID = '00000000-0000-4000-8000-000000000004';

const prisma = new PrismaClient();

async function seedPermissionCatalog(now) {
  const catalog = [
    { key: 'dashboard.read', name: 'View Dashboard', description: 'Access the executive dashboard.', module: 'dashboard' },
    { key: 'reports.read', name: 'View Reports', description: 'Access founder operational reports and CSV export.', module: 'reports' },
    { key: 'settings.read', name: 'View Settings', description: 'View company, workspace, users, roles, and preferences.', module: 'settings' },
    { key: 'settings.update', name: 'Update Settings', description: 'Update company profile, workspace settings, preferences, and user roles.', module: 'settings' },
    { key: 'clients.read', name: 'View Clients', description: 'View client records in the workspace.', module: 'clients' },
    { key: 'clients.create', name: 'Create Clients', description: 'Create new client records.', module: 'clients' },
    { key: 'clients.update', name: 'Update Clients', description: 'Edit existing client records.', module: 'clients' },
    { key: 'clients.archive', name: 'Archive Clients', description: 'Archive client records.', module: 'clients' },
    { key: 'clients.restore', name: 'Restore Clients', description: 'Restore archived client records.', module: 'clients' },
    { key: 'clients.contacts.read', name: 'View Client Contacts', description: 'View contacts on client records.', module: 'clients' },
    { key: 'clients.contacts.manage', name: 'Manage Client Contacts', description: 'Create, update, and delete client contacts.', module: 'clients' },
    { key: 'projects.read', name: 'View Projects', description: 'View project records in the workspace.', module: 'projects' },
    { key: 'projects.create', name: 'Create Projects', description: 'Create new project records.', module: 'projects' },
    { key: 'projects.update', name: 'Update Projects', description: 'Edit existing project records.', module: 'projects' },
    { key: 'tasks.read', name: 'View Tasks', description: 'View task records in the workspace.', module: 'tasks' },
    { key: 'tasks.create', name: 'Create Tasks', description: 'Create new task records.', module: 'tasks' },
    { key: 'tasks.update', name: 'Update Tasks', description: 'Edit existing task records.', module: 'tasks' },
    { key: 'comments.read', name: 'View Comments', description: 'View comments on entities.', module: 'comments' },
    { key: 'comments.manage', name: 'Manage Comments', description: 'Create, update, and delete comments.', module: 'comments' },
    { key: 'files.read', name: 'View Files', description: 'View and download files attached to entities.', module: 'files' },
    { key: 'files.manage', name: 'Manage Files', description: 'Upload and delete files attached to entities.', module: 'files' },
    { key: 'time.read', name: 'View Time Entries', description: 'View logged time on tasks.', module: 'time' },
    { key: 'time.manage', name: 'Manage Time Entries', description: 'Create, update, and delete time entries.', module: 'time' },
    { key: 'sales.read', name: 'View Sales', description: 'View deals and sales pipeline.', module: 'sales' },
    { key: 'sales.create', name: 'Create Deals', description: 'Create new deal records.', module: 'sales' },
    { key: 'sales.update', name: 'Update Deals', description: 'Edit existing deal records and move pipeline stages.', module: 'sales' },
    { key: 'quotes.read', name: 'View Quotes', description: 'View sales quotes in the workspace.', module: 'sales' },
    { key: 'quotes.create', name: 'Create Quotes', description: 'Create new sales quotes.', module: 'sales' },
    { key: 'quotes.update', name: 'Update Quotes', description: 'Edit existing sales quotes.', module: 'sales' },
    { key: 'proposals.read', name: 'View Proposals', description: 'View sales proposals in the workspace.', module: 'sales' },
    { key: 'proposals.create', name: 'Create Proposals', description: 'Create new sales proposals.', module: 'sales' },
    { key: 'proposals.update', name: 'Update Proposals', description: 'Edit existing sales proposals.', module: 'sales' },
    { key: 'invoices.read', name: 'View Invoices', description: 'View invoices in the workspace.', module: 'finance' },
    { key: 'invoices.create', name: 'Create Invoices', description: 'Create new invoices.', module: 'finance' },
    { key: 'invoices.update', name: 'Update Invoices', description: 'Edit existing invoices.', module: 'finance' },
    { key: 'workflows.read', name: 'View Workflows', description: 'View automation workflows in the workspace.', module: 'settings' },
    { key: 'workflows.create', name: 'Create Workflows', description: 'Create new automation workflows.', module: 'settings' },
  ];

  for (const definition of catalog) {
    await prisma.permission.upsert({
      where: { key: definition.key },
      update: {
        name: definition.name,
        description: definition.description,
        module: definition.module,
        updatedAt: now,
      },
      create: {
        id: randomUUID(),
        key: definition.key,
        name: definition.name,
        description: definition.description,
        module: definition.module,
        createdAt: now,
        updatedAt: now,
      },
    });
  }
}

async function seedTenantRbac(tenantId, userId, now) {
  const permissions = await prisma.permission.findMany({
    where: { deletedAt: null },
    select: { id: true },
  });

  const superAdminRole = await prisma.role.upsert({
    where: {
      tenantId_slug: {
        tenantId,
        slug: 'super-admin',
      },
    },
    update: {
      name: 'Super Admin',
      description: 'Full workspace access with permission bypass.',
      updatedAt: now,
    },
    create: {
      id: randomUUID(),
      tenantId,
      name: 'Super Admin',
      slug: 'super-admin',
      description: 'Full workspace access with permission bypass.',
      isSystem: true,
      createdAt: now,
      updatedAt: now,
    },
  });

  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        tenantId_roleId_permissionId: {
          tenantId,
          roleId: superAdminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        id: randomUUID(),
        tenantId,
        roleId: superAdminRole.id,
        permissionId: permission.id,
        createdAt: now,
      },
    });
  }

  await prisma.userRole.upsert({
    where: {
      tenantId_userId_roleId: {
        tenantId,
        userId,
        roleId: superAdminRole.id,
      },
    },
    update: {},
    create: {
      id: randomUUID(),
      tenantId,
      userId,
      roleId: superAdminRole.id,
      createdAt: now,
      updatedAt: now,
    },
  });
}

async function main() {
  const now = new Date();

  await seedPermissionCatalog(now);

  await prisma.agency.upsert({
    where: { id: DEPLOY_DEFAULT_AGENCY_ID },
    update: {
      name: 'AgencyOS Demo Agency',
      slug: 'agencyos-demo',
      isActive: true,
      updatedAt: now,
    },
    create: {
      id: DEPLOY_DEFAULT_AGENCY_ID,
      name: 'AgencyOS Demo Agency',
      slug: 'agencyos-demo',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.user.upsert({
    where: { id: DEPLOY_DEFAULT_USER_ID },
    update: {
      email: 'demo@agencyos.local',
      displayName: 'Demo User',
      isActive: true,
      updatedAt: now,
    },
    create: {
      id: DEPLOY_DEFAULT_USER_ID,
      keycloakSubject: 'demo-user',
      email: 'demo@agencyos.local',
      firstName: 'Demo',
      lastName: 'User',
      displayName: 'Demo User',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.tenant.upsert({
    where: { id: DEPLOY_DEFAULT_TENANT_ID },
    update: {
      name: 'AgencyOS Demo Tenant',
      slug: 'agencyos-demo-tenant',
      isActive: true,
      updatedAt: now,
    },
    create: {
      id: DEPLOY_DEFAULT_TENANT_ID,
      name: 'AgencyOS Demo Tenant',
      slug: 'agencyos-demo-tenant',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.workspace.upsert({
    where: { id: DEPLOY_DEFAULT_WORKSPACE_ID },
    update: {
      name: 'AgencyOS Demo Workspace',
      slug: 'agencyos-demo-workspace',
      isActive: true,
      updatedAt: now,
    },
    create: {
      id: DEPLOY_DEFAULT_WORKSPACE_ID,
      tenantId: DEPLOY_DEFAULT_TENANT_ID,
      agencyId: DEPLOY_DEFAULT_AGENCY_ID,
      name: 'AgencyOS Demo Workspace',
      slug: 'agencyos-demo-workspace',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.employee.upsert({
    where: {
      tenantId_userId: {
        tenantId: DEPLOY_DEFAULT_TENANT_ID,
        userId: DEPLOY_DEFAULT_USER_ID,
      },
    },
    update: {
      workspaceId: DEPLOY_DEFAULT_WORKSPACE_ID,
      status: 'ACTIVE',
      isActive: true,
      updatedAt: now,
    },
    create: {
      id: '00000000-0000-4000-8000-000000000005',
      tenantId: DEPLOY_DEFAULT_TENANT_ID,
      workspaceId: DEPLOY_DEFAULT_WORKSPACE_ID,
      userId: DEPLOY_DEFAULT_USER_ID,
      status: 'ACTIVE',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  });

  await seedTenantRbac(DEPLOY_DEFAULT_TENANT_ID, DEPLOY_DEFAULT_USER_ID, now);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
