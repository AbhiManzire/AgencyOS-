import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import type { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../src/modules/prisma/prisma.service';

export interface WorkspaceFixture {
  readonly agencyId: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly userId: string;
}

/** Applies the current Prisma schema to the test database. */
export function syncTestDatabase(): void {
  const backendRoot = path.resolve(__dirname, '../..');

  execSync('pnpm exec prisma db push --skip-generate --accept-data-loss', {
    cwd: backendRoot,
    env: process.env,
    stdio: 'pipe',
  });
}

/** Seeds isolated agency, tenant, workspace, and user records for client tests. */
export async function seedWorkspaceFixture(app: INestApplication): Promise<WorkspaceFixture> {
  const prisma = app.get(PrismaService);
  const now = new Date();
  const suffix = randomUUID().slice(0, 8);

  const agencyId = randomUUID();
  const tenantId = randomUUID();
  const workspaceId = randomUUID();
  const userId = randomUUID();

  await prisma.agency.create({
    data: {
      id: agencyId,
      name: `Test Agency ${suffix}`,
      slug: `test-agency-${suffix}`,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.user.create({
    data: {
      id: userId,
      keycloakSubject: `test-subject-${suffix}`,
      email: `test-${suffix}@example.com`,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.tenant.create({
    data: {
      id: tenantId,
      name: `Test Tenant ${suffix}`,
      slug: `test-tenant-${suffix}`,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.workspace.create({
    data: {
      id: workspaceId,
      tenantId,
      agencyId,
      name: `Test Workspace ${suffix}`,
      slug: `test-workspace-${suffix}`,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.employee.create({
    data: {
      id: randomUUID(),
      tenantId,
      workspaceId,
      userId,
      status: 'ACTIVE',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  });

  return { agencyId, tenantId, workspaceId, userId };
}

/** Removes data created for a workspace fixture. */
export async function cleanupWorkspaceFixture(
  app: INestApplication,
  fixture: WorkspaceFixture,
): Promise<void> {
  const prisma = app.get(PrismaService);

  await prisma.activity.deleteMany({ where: { tenantId: fixture.tenantId } });
  await prisma.comment.deleteMany({ where: { tenantId: fixture.tenantId } });
  await prisma.file.deleteMany({ where: { tenantId: fixture.tenantId } });
  await prisma.timeEntry.deleteMany({ where: { tenantId: fixture.tenantId } });
  await prisma.clientContact.deleteMany({ where: { tenantId: fixture.tenantId } });
  await prisma.task.deleteMany({ where: { tenantId: fixture.tenantId } });
  await prisma.projectMilestone.deleteMany({ where: { tenantId: fixture.tenantId } });
  await prisma.projectMember.deleteMany({ where: { tenantId: fixture.tenantId } });
  await prisma.employee.deleteMany({ where: { tenantId: fixture.tenantId } });
  await prisma.project.deleteMany({ where: { tenantId: fixture.tenantId } });
  await prisma.client.deleteMany({ where: { tenantId: fixture.tenantId } });
  await prisma.workspace.deleteMany({ where: { id: fixture.workspaceId } });
  await prisma.tenant.deleteMany({ where: { id: fixture.tenantId } });
  await prisma.agency.deleteMany({ where: { id: fixture.agencyId } });
  await prisma.user.deleteMany({ where: { id: fixture.userId } });
}

export function workspaceHeaders(fixture: WorkspaceFixture): Record<string, string> {
  return {
    'x-tenant-id': fixture.tenantId,
    'x-workspace-id': fixture.workspaceId,
    'x-user-id': fixture.userId,
  };
}
