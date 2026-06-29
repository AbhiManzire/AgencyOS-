import './setup-e2e';
import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import request from 'supertest';
import { CLIENT_CONTACT_DOMAIN_ERROR_CODES } from '../src/modules/clients/domain/client-contact-domain.errors';
import { CLIENT_DOMAIN_ERROR_CODES } from '../src/modules/clients/domain/client-domain.errors';
import type { ClientContactRecord } from '../src/modules/clients/repositories/client-contact.repository.interface';
import type { ClientRecord } from '../src/modules/clients/repositories/client.repository.interface';
import { createE2eApp } from './helpers/create-e2e-app';
import {
  cleanupWorkspaceFixture,
  seedWorkspaceFixture,
  syncTestDatabase,
  workspaceHeaders,
  type WorkspaceFixture,
} from './helpers/client-test-context';

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
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

describe('Client Contacts (e2e)', () => {
  let app!: INestApplication<App>;
  let fixture!: WorkspaceFixture;
  let client!: ClientRecord;
  let initialized = false;

  beforeAll(async () => {
    syncTestDatabase();
    app = await createE2eApp();
    fixture = await seedWorkspaceFixture(app);
    client = await createTestClient(app, fixture);
    initialized = true;
  });

  afterAll(async () => {
    if (!initialized) {
      return;
    }

    try {
      await cleanupWorkspaceFixture(app, fixture);
      await app.close();
    } catch {
      // Best-effort teardown.
    }
  });

  describe('GET /api/clients/:id/contacts', () => {
    it('returns an empty list when no contacts exist', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/clients/${client.id}/contacts`)
        .set(workspaceHeaders(fixture))
        .expect(200);

      const body = response.body as ApiSuccessResponse<ClientContactRecord[]>;
      expect(body.success).toBe(true);
      expect(body.data).toEqual([]);
    });

    it('returns 404 when client does not exist', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/clients/${randomUUID()}/contacts`)
        .set(workspaceHeaders(fixture))
        .expect(404);

      const body = response.body as ApiErrorResponse;
      expect(body.error.code).toBe(CLIENT_DOMAIN_ERROR_CODES.CLIENT_NOT_FOUND);
    });
  });

  describe('POST /api/clients/:id/contacts', () => {
    it('creates a contact successfully', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/clients/${client.id}/contacts`)
        .set(workspaceHeaders(fixture))
        .send({
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane.doe@example.com',
          jobTitle: 'Director',
          department: 'Marketing',
          isPrimary: true,
          isDecisionMaker: true,
          status: 'ACTIVE',
        })
        .expect(201);

      const body = response.body as ApiSuccessResponse<ClientContactRecord>;
      expect(body.success).toBe(true);
      expect(body.data.firstName).toBe('Jane');
      expect(body.data.lastName).toBe('Doe');
      expect(body.data.email).toBe('jane.doe@example.com');
      expect(body.data.isPrimary).toBe(true);
      expect(body.data.isDecisionMaker).toBe(true);
      expect(body.data.clientId).toBe(client.id);
      expect(body.data.tenantId).toBe(fixture.tenantId);
      expect(body.data.workspaceId).toBe(fixture.workspaceId);
    });

    it('returns validation error when firstName is missing', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/clients/${client.id}/contacts`)
        .set(workspaceHeaders(fixture))
        .send({ email: 'missing-name@example.com' })
        .expect(400);

      const body = response.body as ApiErrorResponse;
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns validation error for invalid email format', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/clients/${client.id}/contacts`)
        .set(workspaceHeaders(fixture))
        .send({ firstName: 'Invalid', email: 'not-an-email' })
        .expect(400);

      const body = response.body as ApiErrorResponse;
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('demotes the previous primary contact when a new primary is created', async () => {
      const suffix = randomUUID().slice(0, 8);

      const firstResponse = await request(app.getHttpServer())
        .post(`/api/clients/${client.id}/contacts`)
        .set(workspaceHeaders(fixture))
        .send({
          firstName: `Primary A ${suffix}`,
          isPrimary: true,
        })
        .expect(201);

      const first = (firstResponse.body as ApiSuccessResponse<ClientContactRecord>).data;

      const secondResponse = await request(app.getHttpServer())
        .post(`/api/clients/${client.id}/contacts`)
        .set(workspaceHeaders(fixture))
        .send({
          firstName: `Primary B ${suffix}`,
          isPrimary: true,
        })
        .expect(201);

      const second = (secondResponse.body as ApiSuccessResponse<ClientContactRecord>).data;
      expect(second.isPrimary).toBe(true);

      const listResponse = await request(app.getHttpServer())
        .get(`/api/clients/${client.id}/contacts`)
        .set(workspaceHeaders(fixture))
        .expect(200);

      const contacts = (listResponse.body as ApiSuccessResponse<ClientContactRecord[]>).data;
      const firstAfter = contacts.find((contact) => contact.id === first.id);
      const secondAfter = contacts.find((contact) => contact.id === second.id);

      expect(firstAfter?.isPrimary).toBe(false);
      expect(secondAfter?.isPrimary).toBe(true);
    });

    it('blocks contact creation when client is archived', async () => {
      const archivedClient = await createTestClient(
        app,
        fixture,
        `Archived ${randomUUID().slice(0, 8)}`,
      );

      await request(app.getHttpServer())
        .post(`/api/clients/${archivedClient.id}/archive`)
        .set(workspaceHeaders(fixture))
        .send({})
        .expect(201);

      const response = await request(app.getHttpServer())
        .post(`/api/clients/${archivedClient.id}/contacts`)
        .set(workspaceHeaders(fixture))
        .send({ firstName: 'Blocked' })
        .expect(422);

      const body = response.body as ApiErrorResponse;
      expect(body.error.code).toBe(CLIENT_DOMAIN_ERROR_CODES.CLIENT_ARCHIVED);
    });
  });

  describe('PATCH /api/clients/:id/contacts/:contactId', () => {
    it('updates a contact successfully', async () => {
      const createdResponse = await request(app.getHttpServer())
        .post(`/api/clients/${client.id}/contacts`)
        .set(workspaceHeaders(fixture))
        .send({ firstName: 'Before Update', email: 'before@example.com' })
        .expect(201);

      const created = (createdResponse.body as ApiSuccessResponse<ClientContactRecord>).data;

      const response = await request(app.getHttpServer())
        .patch(`/api/clients/${client.id}/contacts/${created.id}`)
        .set(workspaceHeaders(fixture))
        .send({
          firstName: 'After Update',
          email: 'after@example.com',
          status: 'INACTIVE',
        })
        .expect(200);

      const body = response.body as ApiSuccessResponse<ClientContactRecord>;
      expect(body.data.firstName).toBe('After Update');
      expect(body.data.email).toBe('after@example.com');
      expect(body.data.status).toBe('INACTIVE');
    });

    it('returns 404 when contact does not exist', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/clients/${client.id}/contacts/${randomUUID()}`)
        .set(workspaceHeaders(fixture))
        .send({ firstName: 'Missing' })
        .expect(404);

      const body = response.body as ApiErrorResponse;
      expect(body.error.code).toBe(CLIENT_CONTACT_DOMAIN_ERROR_CODES.CLIENT_CONTACT_NOT_FOUND);
    });
  });

  describe('DELETE /api/clients/:id/contacts/:contactId', () => {
    it('soft-deletes a contact successfully', async () => {
      const createdResponse = await request(app.getHttpServer())
        .post(`/api/clients/${client.id}/contacts`)
        .set(workspaceHeaders(fixture))
        .send({ firstName: 'To Delete' })
        .expect(201);

      const created = (createdResponse.body as ApiSuccessResponse<ClientContactRecord>).data;

      const response = await request(app.getHttpServer())
        .delete(`/api/clients/${client.id}/contacts/${created.id}`)
        .set(workspaceHeaders(fixture))
        .expect(200);

      const body = response.body as ApiSuccessResponse<ClientContactRecord>;
      expect(body.data.deletedAt).not.toBeNull();

      const listResponse = await request(app.getHttpServer())
        .get(`/api/clients/${client.id}/contacts`)
        .set(workspaceHeaders(fixture))
        .expect(200);

      const contacts = (listResponse.body as ApiSuccessResponse<ClientContactRecord[]>).data;
      expect(contacts.some((contact) => contact.id === created.id)).toBe(false);
    });

    it('returns 404 when contact does not exist', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/clients/${client.id}/contacts/${randomUUID()}`)
        .set(workspaceHeaders(fixture))
        .expect(404);

      const body = response.body as ApiErrorResponse;
      expect(body.error.code).toBe(CLIENT_CONTACT_DOMAIN_ERROR_CODES.CLIENT_CONTACT_NOT_FOUND);
    });
  });
});

async function createTestClient(
  app: INestApplication<App>,
  fixture: WorkspaceFixture,
  displayName?: string,
): Promise<ClientRecord> {
  const suffix = randomUUID().slice(0, 8);
  const name = displayName ?? `Contact Test Client ${suffix}`;

  const response = await request(app.getHttpServer())
    .post('/api/clients')
    .set(workspaceHeaders(fixture))
    .send({
      displayName: name,
      slug: `contact-test-client-${suffix}`,
      status: 'ACTIVE',
    })
    .expect(201);

  return (response.body as ApiSuccessResponse<ClientRecord>).data;
}
