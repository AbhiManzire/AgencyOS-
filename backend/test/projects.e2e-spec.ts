import './setup-e2e';
import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import request from 'supertest';
import type { ClientRecord } from '../src/modules/clients/repositories/client.repository.interface';
import { PROJECT_DOMAIN_ERROR_CODES } from '../src/modules/projects/domain/project-domain.errors';
import type { ProjectRecord } from '../src/modules/projects/repositories/project.repository.interface';
import { createE2eApp } from './helpers/create-e2e-app';
import {
  cleanupWorkspaceFixture,
  seedWorkspaceFixture,
  syncTestDatabase,
  workspaceHeaders,
  type WorkspaceFixture,
} from './helpers/client-test-context';
import { PrismaService } from '../src/modules/prisma/prisma.service';

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    total?: number;
    skip?: number;
    take?: number;
  };
}

interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
    details?: { field: string; message: string }[];
  };
}

jest.setTimeout(60_000);

describe('Projects (e2e)', () => {
  let app!: INestApplication<App>;
  let primary!: WorkspaceFixture;
  let secondary!: WorkspaceFixture;
  let initialized = false;

  beforeAll(async () => {
    syncTestDatabase();
    app = await createE2eApp();
    primary = await seedWorkspaceFixture(app);
    secondary = await seedWorkspaceFixture(app);
    initialized = true;
  });

  afterAll(async () => {
    if (!initialized) {
      return;
    }

    try {
      await cleanupWorkspaceFixture(app, primary);
      await cleanupWorkspaceFixture(app, secondary);
      await app.get(PrismaService).$disconnect();
    } finally {
      await app.close();
    }
  });

  async function createTestClient(fixture: WorkspaceFixture): Promise<ClientRecord> {
    const suffix = randomUUID().slice(0, 8);

    const response = await request(app.getHttpServer())
      .post('/api/clients')
      .set(workspaceHeaders(fixture))
      .send({
        displayName: `Project Client ${suffix}`,
        slug: `project-client-${suffix}`,
        status: 'ACTIVE',
      })
      .expect(201);

    return (response.body as ApiSuccessResponse<ClientRecord>).data;
  }

  describe('POST /api/projects', () => {
    it('creates a project successfully', async () => {
      const client = await createTestClient(primary);
      const suffix = randomUUID().slice(0, 8);

      const response = await request(app.getHttpServer())
        .post('/api/projects')
        .set(workspaceHeaders(primary))
        .send({
          clientId: client.id,
          name: `Website Redesign ${suffix}`,
          code: `PRJ-${suffix}`,
          status: 'PLANNING',
          projectManagerUserId: primary.userId,
        })
        .expect(201);

      const body = response.body as ApiSuccessResponse<ProjectRecord>;
      expect(body.success).toBe(true);
      expect(body.data.name).toBe(`Website Redesign ${suffix}`);
      expect(body.data.clientId).toBe(client.id);
      expect(body.data.tenantId).toBe(primary.tenantId);
      expect(body.data.workspaceId).toBe(primary.workspaceId);
      expect(body.data.status).toBe('PLANNING');
      expect(body.data.deletedAt).toBeNull();
      expect(body.data.createdByUserId).toBe(primary.userId);
    });

    it('returns validation error when name is missing', async () => {
      const client = await createTestClient(primary);

      const response = await request(app.getHttpServer())
        .post('/api/projects')
        .set(workspaceHeaders(primary))
        .send({
          clientId: client.id,
          projectManagerUserId: primary.userId,
        })
        .expect(400);

      const body = response.body as ApiErrorResponse;
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns not found when client does not exist', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/projects')
        .set(workspaceHeaders(primary))
        .send({
          clientId: randomUUID(),
          name: 'Orphan Project',
          projectManagerUserId: primary.userId,
        })
        .expect(404);

      const body = response.body as ApiErrorResponse;
      expect(body.error.code).toBe(PROJECT_DOMAIN_ERROR_CODES.CLIENT_NOT_FOUND);
    });

    it('returns conflict for duplicate project code in workspace', async () => {
      const client = await createTestClient(primary);
      const code = `DUP-${randomUUID().slice(0, 8)}`;

      await request(app.getHttpServer())
        .post('/api/projects')
        .set(workspaceHeaders(primary))
        .send({
          clientId: client.id,
          name: 'First Project',
          code,
          projectManagerUserId: primary.userId,
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/api/projects')
        .set(workspaceHeaders(primary))
        .send({
          clientId: client.id,
          name: 'Second Project',
          code,
          projectManagerUserId: primary.userId,
        })
        .expect(409);

      const body = response.body as ApiErrorResponse;
      expect(body.error.code).toBe(PROJECT_DOMAIN_ERROR_CODES.PROJECT_CODE_NOT_UNIQUE);
    });

    it('rejects project creation for archived client', async () => {
      const client = await createTestClient(primary);

      await request(app.getHttpServer())
        .post(`/api/clients/${client.id}/archive`)
        .set(workspaceHeaders(primary))
        .send({})
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/api/projects')
        .set(workspaceHeaders(primary))
        .send({
          clientId: client.id,
          name: 'Blocked Project',
          projectManagerUserId: primary.userId,
        })
        .expect(422);

      const body = response.body as ApiErrorResponse;
      expect(body.error.code).toBe(PROJECT_DOMAIN_ERROR_CODES.CLIENT_ARCHIVED);
    });
  });

  describe('GET /api/projects', () => {
    it('lists projects with pagination metadata', async () => {
      const client = await createTestClient(primary);
      const suffix = randomUUID().slice(0, 8);

      await request(app.getHttpServer())
        .post('/api/projects')
        .set(workspaceHeaders(primary))
        .send({
          clientId: client.id,
          name: `Listed Project ${suffix}`,
          projectManagerUserId: primary.userId,
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/api/projects')
        .set(workspaceHeaders(primary))
        .query({ clientId: client.id, take: 10 })
        .expect(200);

      const body = response.body as ApiSuccessResponse<ProjectRecord[]>;
      expect(body.success).toBe(true);
      expect(body.meta?.total).toBeGreaterThanOrEqual(1);
      expect(body.meta?.take).toBe(10);
      expect(body.data.some((project) => project.name === `Listed Project ${suffix}`)).toBe(true);
    });

    it('does not return projects from another workspace', async () => {
      const client = await createTestClient(primary);
      const suffix = randomUUID().slice(0, 8);

      const createResponse = await request(app.getHttpServer())
        .post('/api/projects')
        .set(workspaceHeaders(primary))
        .send({
          clientId: client.id,
          name: `Isolated Project ${suffix}`,
          projectManagerUserId: primary.userId,
        })
        .expect(201);

      const project = (createResponse.body as ApiSuccessResponse<ProjectRecord>).data;

      await request(app.getHttpServer())
        .get(`/api/projects/${project.id}`)
        .set(workspaceHeaders(secondary))
        .expect(404);
    });
  });

  describe('GET /api/projects/:id', () => {
    it('returns a project by id', async () => {
      const client = await createTestClient(primary);
      const suffix = randomUUID().slice(0, 8);

      const createResponse = await request(app.getHttpServer())
        .post('/api/projects')
        .set(workspaceHeaders(primary))
        .send({
          clientId: client.id,
          name: `Detail Project ${suffix}`,
          projectManagerUserId: primary.userId,
        })
        .expect(201);

      const created = (createResponse.body as ApiSuccessResponse<ProjectRecord>).data;

      const response = await request(app.getHttpServer())
        .get(`/api/projects/${created.id}`)
        .set(workspaceHeaders(primary))
        .expect(200);

      const body = response.body as ApiSuccessResponse<ProjectRecord>;
      expect(body.data.id).toBe(created.id);
      expect(body.data.name).toBe(`Detail Project ${suffix}`);
    });
  });

  describe('PATCH /api/projects/:id', () => {
    it('updates a project successfully', async () => {
      const client = await createTestClient(primary);
      const suffix = randomUUID().slice(0, 8);

      const createResponse = await request(app.getHttpServer())
        .post('/api/projects')
        .set(workspaceHeaders(primary))
        .send({
          clientId: client.id,
          name: `Patch Project ${suffix}`,
          status: 'PLANNING',
          projectManagerUserId: primary.userId,
        })
        .expect(201);

      const created = (createResponse.body as ApiSuccessResponse<ProjectRecord>).data;

      const response = await request(app.getHttpServer())
        .patch(`/api/projects/${created.id}`)
        .set(workspaceHeaders(primary))
        .send({
          name: `Updated Project ${suffix}`,
          status: 'ACTIVE',
        })
        .expect(200);

      const body = response.body as ApiSuccessResponse<ProjectRecord>;
      expect(body.data.name).toBe(`Updated Project ${suffix}`);
      expect(body.data.status).toBe('ACTIVE');
      expect(body.data.updatedByUserId).toBe(primary.userId);
    });

    it('rejects invalid status transition', async () => {
      const client = await createTestClient(primary);

      const createResponse = await request(app.getHttpServer())
        .post('/api/projects')
        .set(workspaceHeaders(primary))
        .send({
          clientId: client.id,
          name: 'Transition Project',
          status: 'PLANNING',
          projectManagerUserId: primary.userId,
        })
        .expect(201);

      const created = (createResponse.body as ApiSuccessResponse<ProjectRecord>).data;

      const response = await request(app.getHttpServer())
        .patch(`/api/projects/${created.id}`)
        .set(workspaceHeaders(primary))
        .send({ status: 'COMPLETED' })
        .expect(422);

      const body = response.body as ApiErrorResponse;
      expect(body.error.code).toBe(PROJECT_DOMAIN_ERROR_CODES.INVALID_STATUS_TRANSITION);
    });
  });
});
