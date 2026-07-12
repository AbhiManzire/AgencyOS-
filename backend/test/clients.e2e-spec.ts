import './setup-e2e';
import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import request from 'supertest';
import { CLIENT_DOMAIN_ERROR_CODES } from '../src/modules/clients/domain/client-domain.errors';
import type { ClientRecord } from '../src/modules/clients/repositories/client.repository.interface';
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

describe('Clients (e2e)', () => {
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

  describe('POST /api/clients', () => {
    it('creates a client successfully', async () => {
      const suffix = randomUUID().slice(0, 8);

      const response = await request(app.getHttpServer())
        .post('/api/clients')
        .set(workspaceHeaders(primary))
        .send({
          displayName: `Acme Corp ${suffix}`,
          slug: `acme-corp-${suffix}`,
          status: 'PROSPECT',
        })
        .expect(201);

      const body = response.body as ApiSuccessResponse<ClientRecord>;
      expect(body.success).toBe(true);
      expect(body.data.displayName).toBe(`Acme Corp ${suffix}`);
      expect(body.data.slug).toBe(`acme-corp-${suffix}`);
      expect(body.data.tenantId).toBe(primary.tenantId);
      expect(body.data.workspaceId).toBe(primary.workspaceId);
      expect(body.data.deletedAt).toBeNull();
      expect(body.data.clientCode).toMatch(/^CL-\d{6}$/);
    });

    it('returns validation error when displayName is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/clients')
        .set(workspaceHeaders(primary))
        .send({ slug: 'missing-name' })
        .expect(400);

      const body = response.body as ApiErrorResponse;
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.statusCode).toBe(400);
    });

    it('returns validation error for invalid email format', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/clients')
        .set(workspaceHeaders(primary))
        .send({
          displayName: 'Invalid Email Client',
          email: 'not-an-email',
        })
        .expect(400);

      const body = response.body as ApiErrorResponse;
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns conflict for duplicate display name in workspace', async () => {
      const suffix = randomUUID().slice(0, 8);
      const displayName = `Duplicate Name ${suffix}`;

      await request(app.getHttpServer())
        .post('/api/clients')
        .set(workspaceHeaders(primary))
        .send({ displayName, slug: `dup-name-a-${suffix}` })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/api/clients')
        .set(workspaceHeaders(primary))
        .send({ displayName, slug: `dup-name-b-${suffix}` })
        .expect(409);

      const body = response.body as ApiErrorResponse;
      expect(body.error.code).toBe(CLIENT_DOMAIN_ERROR_CODES.DISPLAY_NAME_NOT_UNIQUE);
    });

    it('returns conflict for duplicate slug in workspace', async () => {
      const suffix = randomUUID().slice(0, 8);
      const slug = `duplicate-slug-${suffix}`;

      await request(app.getHttpServer())
        .post('/api/clients')
        .set(workspaceHeaders(primary))
        .send({ displayName: `First ${suffix}`, slug })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/api/clients')
        .set(workspaceHeaders(primary))
        .send({ displayName: `Second ${suffix}`, slug })
        .expect(409);

      const body = response.body as ApiErrorResponse;
      expect(body.error.code).toBe(CLIENT_DOMAIN_ERROR_CODES.SLUG_NOT_UNIQUE);
    });
  });

  describe('GET /api/clients', () => {
    it('lists active clients for the workspace', async () => {
      const suffix = randomUUID().slice(0, 8);

      await request(app.getHttpServer())
        .post('/api/clients')
        .set(workspaceHeaders(primary))
        .send({ displayName: `List Client ${suffix}`, slug: `list-client-${suffix}` })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/api/clients')
        .set(workspaceHeaders(primary))
        .expect(200);

      const body = response.body as ApiSuccessResponse<ClientRecord[]>;
      expect(body.success).toBe(true);
      expect(body.meta?.total).toBeGreaterThanOrEqual(1);
      expect(body.data.some((client) => client.slug === `list-client-${suffix}`)).toBe(true);
    });

    it('excludes archived clients by default (soft delete behavior)', async () => {
      const suffix = randomUUID().slice(0, 8);
      const slug = `archived-list-${suffix}`;

      const created = await request(app.getHttpServer())
        .post('/api/clients')
        .set(workspaceHeaders(primary))
        .send({ displayName: `Archived List ${suffix}`, slug })
        .expect(201);

      const clientId = (created.body as ApiSuccessResponse<ClientRecord>).data.id;

      await request(app.getHttpServer())
        .post(`/api/clients/${clientId}/archive`)
        .set(workspaceHeaders(primary))
        .send({})
        .expect(201);

      const activeList = await request(app.getHttpServer())
        .get('/api/clients')
        .set(workspaceHeaders(primary))
        .expect(200);

      const activeBody = activeList.body as ApiSuccessResponse<ClientRecord[]>;
      expect(activeBody.data.some((client) => client.id === clientId)).toBe(false);

      const archivedList = await request(app.getHttpServer())
        .get('/api/clients?includeArchived=true')
        .set(workspaceHeaders(primary))
        .expect(200);

      const archivedBody = archivedList.body as ApiSuccessResponse<ClientRecord[]>;
      expect(archivedBody.data.some((client) => client.id === clientId)).toBe(true);
    });

    it('enforces workspace isolation in list results', async () => {
      const suffix = randomUUID().slice(0, 8);
      const slug = `isolated-list-${suffix}`;

      await request(app.getHttpServer())
        .post('/api/clients')
        .set(workspaceHeaders(primary))
        .send({ displayName: `Isolated ${suffix}`, slug })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/api/clients')
        .set(workspaceHeaders(secondary))
        .expect(200);

      const body = response.body as ApiSuccessResponse<ClientRecord[]>;
      expect(body.data.some((client) => client.slug === slug)).toBe(false);
    });
  });

  describe('GET /api/clients/:id', () => {
    it('returns a client by id', async () => {
      const suffix = randomUUID().slice(0, 8);

      const created = await request(app.getHttpServer())
        .post('/api/clients')
        .set(workspaceHeaders(primary))
        .send({ displayName: `Get By Id ${suffix}`, slug: `get-by-id-${suffix}` })
        .expect(201);

      const clientId = (created.body as ApiSuccessResponse<ClientRecord>).data.id;

      const response = await request(app.getHttpServer())
        .get(`/api/clients/${clientId}`)
        .set(workspaceHeaders(primary))
        .expect(200);

      const body = response.body as ApiSuccessResponse<ClientRecord>;
      expect(body.data.id).toBe(clientId);
    });

    it('returns not found for unknown client id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/clients/${randomUUID()}`)
        .set(workspaceHeaders(primary))
        .expect(404);

      const body = response.body as ApiErrorResponse;
      expect(body.error.code).toBe(CLIENT_DOMAIN_ERROR_CODES.CLIENT_NOT_FOUND);
    });

    it('returns not found when accessing client from another workspace', async () => {
      const suffix = randomUUID().slice(0, 8);

      const created = await request(app.getHttpServer())
        .post('/api/clients')
        .set(workspaceHeaders(primary))
        .send({ displayName: `Cross Workspace ${suffix}`, slug: `cross-ws-${suffix}` })
        .expect(201);

      const clientId = (created.body as ApiSuccessResponse<ClientRecord>).data.id;

      const response = await request(app.getHttpServer())
        .get(`/api/clients/${clientId}`)
        .set(workspaceHeaders(secondary))
        .expect(404);

      const body = response.body as ApiErrorResponse;
      expect(body.error.code).toBe(CLIENT_DOMAIN_ERROR_CODES.CLIENT_NOT_FOUND);
    });

    it('returns not found for archived client (soft delete behavior)', async () => {
      const suffix = randomUUID().slice(0, 8);

      const created = await request(app.getHttpServer())
        .post('/api/clients')
        .set(workspaceHeaders(primary))
        .send({ displayName: `Archived Get ${suffix}`, slug: `archived-get-${suffix}` })
        .expect(201);

      const clientId = (created.body as ApiSuccessResponse<ClientRecord>).data.id;

      await request(app.getHttpServer())
        .post(`/api/clients/${clientId}/archive`)
        .set(workspaceHeaders(primary))
        .send({})
        .expect(201);

      const response = await request(app.getHttpServer())
        .get(`/api/clients/${clientId}`)
        .set(workspaceHeaders(primary))
        .expect(404);

      const body = response.body as ApiErrorResponse;
      expect(body.error.code).toBe(CLIENT_DOMAIN_ERROR_CODES.CLIENT_NOT_FOUND);
    });
  });

  describe('PATCH /api/clients/:id', () => {
    it('updates a client successfully', async () => {
      const suffix = randomUUID().slice(0, 8);

      const created = await request(app.getHttpServer())
        .post('/api/clients')
        .set(workspaceHeaders(primary))
        .send({ displayName: `Patch Target ${suffix}`, slug: `patch-target-${suffix}` })
        .expect(201);

      const clientId = (created.body as ApiSuccessResponse<ClientRecord>).data.id;

      const response = await request(app.getHttpServer())
        .patch(`/api/clients/${clientId}`)
        .set(workspaceHeaders(primary))
        .send({ displayName: `Patched Name ${suffix}` })
        .expect(200);

      const body = response.body as ApiSuccessResponse<ClientRecord>;
      expect(body.data.displayName).toBe(`Patched Name ${suffix}`);
    });

    it('returns domain error when updating an archived client', async () => {
      const suffix = randomUUID().slice(0, 8);

      const created = await request(app.getHttpServer())
        .post('/api/clients')
        .set(workspaceHeaders(primary))
        .send({ displayName: `Patch Archived ${suffix}`, slug: `patch-archived-${suffix}` })
        .expect(201);

      const clientId = (created.body as ApiSuccessResponse<ClientRecord>).data.id;

      await request(app.getHttpServer())
        .post(`/api/clients/${clientId}/archive`)
        .set(workspaceHeaders(primary))
        .send({})
        .expect(201);

      const response = await request(app.getHttpServer())
        .patch(`/api/clients/${clientId}`)
        .set(workspaceHeaders(primary))
        .send({ displayName: 'Should Fail' })
        .expect(422);

      const body = response.body as ApiErrorResponse;
      expect(body.error.code).toBe(CLIENT_DOMAIN_ERROR_CODES.CLIENT_ARCHIVED);
    });

    it('returns not found for unknown client id', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/clients/${randomUUID()}`)
        .set(workspaceHeaders(primary))
        .send({ displayName: 'Missing Client' })
        .expect(404);

      const body = response.body as ApiErrorResponse;
      expect(body.error.code).toBe(CLIENT_DOMAIN_ERROR_CODES.CLIENT_NOT_FOUND);
    });
  });

  describe('POST /api/clients/:id/archive', () => {
    it('archives a client successfully', async () => {
      const suffix = randomUUID().slice(0, 8);

      const created = await request(app.getHttpServer())
        .post('/api/clients')
        .set(workspaceHeaders(primary))
        .send({ displayName: `Archive Me ${suffix}`, slug: `archive-me-${suffix}` })
        .expect(201);

      const clientId = (created.body as ApiSuccessResponse<ClientRecord>).data.id;

      const response = await request(app.getHttpServer())
        .post(`/api/clients/${clientId}/archive`)
        .set(workspaceHeaders(primary))
        .send({ confirmed: true })
        .expect(201);

      const body = response.body as ApiSuccessResponse<ClientRecord>;
      expect(body.data.status).toBe('ARCHIVED');
      expect(body.data.deletedAt).not.toBeNull();
      expect(body.data.deletedByUserId).toBe(primary.userId);
    });

    it('returns not found for unknown client id', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/clients/${randomUUID()}/archive`)
        .set(workspaceHeaders(primary))
        .send({})
        .expect(404);

      const body = response.body as ApiErrorResponse;
      expect(body.error.code).toBe(CLIENT_DOMAIN_ERROR_CODES.CLIENT_NOT_FOUND);
    });
  });

  describe('POST /api/clients/:id/restore', () => {
    it('restores an archived client successfully', async () => {
      const suffix = randomUUID().slice(0, 8);

      const created = await request(app.getHttpServer())
        .post('/api/clients')
        .set(workspaceHeaders(primary))
        .send({ displayName: `Restore Me ${suffix}`, slug: `restore-me-${suffix}` })
        .expect(201);

      const clientId = (created.body as ApiSuccessResponse<ClientRecord>).data.id;

      await request(app.getHttpServer())
        .post(`/api/clients/${clientId}/archive`)
        .set(workspaceHeaders(primary))
        .send({})
        .expect(201);

      const response = await request(app.getHttpServer())
        .post(`/api/clients/${clientId}/restore`)
        .set(workspaceHeaders(primary))
        .send({ targetStatus: 'ACTIVE' })
        .expect(201);

      const body = response.body as ApiSuccessResponse<ClientRecord>;
      expect(body.data.status).toBe('ACTIVE');
      expect(body.data.deletedAt).toBeNull();

      await request(app.getHttpServer())
        .get(`/api/clients/${clientId}`)
        .set(workspaceHeaders(primary))
        .expect(200);
    });

    it('returns domain error when restoring a non-archived client', async () => {
      const suffix = randomUUID().slice(0, 8);

      const created = await request(app.getHttpServer())
        .post('/api/clients')
        .set(workspaceHeaders(primary))
        .send({ displayName: `Active Restore ${suffix}`, slug: `active-restore-${suffix}` })
        .expect(201);

      const clientId = (created.body as ApiSuccessResponse<ClientRecord>).data.id;

      const response = await request(app.getHttpServer())
        .post(`/api/clients/${clientId}/restore`)
        .set(workspaceHeaders(primary))
        .send({})
        .expect(422);

      const body = response.body as ApiErrorResponse;
      expect(body.error.code).toBe(CLIENT_DOMAIN_ERROR_CODES.CLIENT_NOT_ARCHIVED);
    });

    it('returns not found for unknown client id', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/clients/${randomUUID()}/restore`)
        .set(workspaceHeaders(primary))
        .send({})
        .expect(404);

      const body = response.body as ApiErrorResponse;
      expect(body.error.code).toBe(CLIENT_DOMAIN_ERROR_CODES.CLIENT_NOT_FOUND);
    });
  });
});
