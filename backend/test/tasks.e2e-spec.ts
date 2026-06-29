import './setup-e2e';
import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import request from 'supertest';
import type { ClientRecord } from '../src/modules/clients/repositories/client.repository.interface';
import type { ProjectRecord } from '../src/modules/projects/repositories/project.repository.interface';
import { TASK_DOMAIN_ERROR_CODES } from '../src/modules/tasks/domain/task-domain.errors';
import type { TaskRecord } from '../src/modules/tasks/repositories/task.repository.interface';
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

describe('Tasks (e2e)', () => {
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
        displayName: `Task Client ${suffix}`,
        slug: `task-client-${suffix}`,
        status: 'ACTIVE',
      })
      .expect(201);

    return (response.body as ApiSuccessResponse<ClientRecord>).data;
  }

  async function createTestProject(fixture: WorkspaceFixture): Promise<ProjectRecord> {
    const client = await createTestClient(fixture);
    const suffix = randomUUID().slice(0, 8);

    const response = await request(app.getHttpServer())
      .post('/api/projects')
      .set(workspaceHeaders(fixture))
      .send({
        clientId: client.id,
        name: `Task Project ${suffix}`,
      })
      .expect(201);

    return (response.body as ApiSuccessResponse<ProjectRecord>).data;
  }

  describe('POST /api/tasks', () => {
    it('creates a task successfully', async () => {
      const project = await createTestProject(primary);
      const suffix = randomUUID().slice(0, 8);

      const response = await request(app.getHttpServer())
        .post('/api/tasks')
        .set(workspaceHeaders(primary))
        .send({
          projectId: project.id,
          title: `Design mockups ${suffix}`,
          priority: 'HIGH',
          estimatedHours: 8,
        })
        .expect(201);

      const body = response.body as ApiSuccessResponse<TaskRecord>;
      expect(body.success).toBe(true);
      expect(body.data.title).toBe(`Design mockups ${suffix}`);
      expect(body.data.projectId).toBe(project.id);
      expect(body.data.tenantId).toBe(primary.tenantId);
      expect(body.data.workspaceId).toBe(primary.workspaceId);
      expect(body.data.status).toBe('TODO');
      expect(body.data.priority).toBe('HIGH');
      expect(body.data.estimatedHours).toBe(8);
      expect(body.data.deletedAt).toBeNull();
      expect(body.data.createdByUserId).toBe(primary.userId);
    });

    it('returns validation error when title is missing', async () => {
      const project = await createTestProject(primary);

      const response = await request(app.getHttpServer())
        .post('/api/tasks')
        .set(workspaceHeaders(primary))
        .send({ projectId: project.id })
        .expect(400);

      const body = response.body as ApiErrorResponse;
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns not found when project does not exist', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/tasks')
        .set(workspaceHeaders(primary))
        .send({
          projectId: randomUUID(),
          title: 'Orphan Task',
        })
        .expect(404);

      const body = response.body as ApiErrorResponse;
      expect(body.error.code).toBe(TASK_DOMAIN_ERROR_CODES.PROJECT_NOT_FOUND);
    });

    it('assigns task to workspace user', async () => {
      const project = await createTestProject(primary);

      const response = await request(app.getHttpServer())
        .post('/api/tasks')
        .set(workspaceHeaders(primary))
        .send({
          projectId: project.id,
          title: 'Assigned Task',
          assigneeUserId: primary.userId,
        })
        .expect(201);

      const body = response.body as ApiSuccessResponse<TaskRecord>;
      expect(body.data.assigneeUserId).toBe(primary.userId);
      expect(body.data.assigneeEmail).toBeTruthy();
    });
  });

  describe('GET /api/tasks', () => {
    it('lists tasks with pagination metadata', async () => {
      const project = await createTestProject(primary);
      const suffix = randomUUID().slice(0, 8);

      await request(app.getHttpServer())
        .post('/api/tasks')
        .set(workspaceHeaders(primary))
        .send({
          projectId: project.id,
          title: `Listed Task ${suffix}`,
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/api/tasks')
        .set(workspaceHeaders(primary))
        .query({ projectId: project.id, take: 10 })
        .expect(200);

      const body = response.body as ApiSuccessResponse<TaskRecord[]>;
      expect(body.success).toBe(true);
      expect(body.meta?.total).toBeGreaterThanOrEqual(1);
      expect(body.meta?.take).toBe(10);
      expect(body.data.some((task) => task.title === `Listed Task ${suffix}`)).toBe(true);
    });

    it('does not return tasks from another workspace', async () => {
      const project = await createTestProject(primary);

      const createResponse = await request(app.getHttpServer())
        .post('/api/tasks')
        .set(workspaceHeaders(primary))
        .send({
          projectId: project.id,
          title: 'Isolated Task',
        })
        .expect(201);

      const task = (createResponse.body as ApiSuccessResponse<TaskRecord>).data;

      await request(app.getHttpServer())
        .get(`/api/tasks/${task.id}`)
        .set(workspaceHeaders(secondary))
        .expect(404);
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('returns a task by id', async () => {
      const project = await createTestProject(primary);
      const suffix = randomUUID().slice(0, 8);

      const createResponse = await request(app.getHttpServer())
        .post('/api/tasks')
        .set(workspaceHeaders(primary))
        .send({
          projectId: project.id,
          title: `Detail Task ${suffix}`,
        })
        .expect(201);

      const created = (createResponse.body as ApiSuccessResponse<TaskRecord>).data;

      const response = await request(app.getHttpServer())
        .get(`/api/tasks/${created.id}`)
        .set(workspaceHeaders(primary))
        .expect(200);

      const body = response.body as ApiSuccessResponse<TaskRecord>;
      expect(body.data.id).toBe(created.id);
      expect(body.data.title).toBe(`Detail Task ${suffix}`);
    });
  });

  describe('PATCH /api/tasks/:id', () => {
    it('updates a task successfully', async () => {
      const project = await createTestProject(primary);
      const suffix = randomUUID().slice(0, 8);

      const createResponse = await request(app.getHttpServer())
        .post('/api/tasks')
        .set(workspaceHeaders(primary))
        .send({
          projectId: project.id,
          title: `Patch Task ${suffix}`,
          status: 'TODO',
        })
        .expect(201);

      const created = (createResponse.body as ApiSuccessResponse<TaskRecord>).data;

      const response = await request(app.getHttpServer())
        .patch(`/api/tasks/${created.id}`)
        .set(workspaceHeaders(primary))
        .send({
          title: `Updated Task ${suffix}`,
          status: 'IN_PROGRESS',
          priority: 'URGENT',
        })
        .expect(200);

      const body = response.body as ApiSuccessResponse<TaskRecord>;
      expect(body.data.title).toBe(`Updated Task ${suffix}`);
      expect(body.data.status).toBe('IN_PROGRESS');
      expect(body.data.priority).toBe('URGENT');
      expect(body.data.updatedByUserId).toBe(primary.userId);
    });

    it('rejects invalid status transition', async () => {
      const project = await createTestProject(primary);

      const createResponse = await request(app.getHttpServer())
        .post('/api/tasks')
        .set(workspaceHeaders(primary))
        .send({
          projectId: project.id,
          title: 'Transition Task',
          status: 'TODO',
        })
        .expect(201);

      const created = (createResponse.body as ApiSuccessResponse<TaskRecord>).data;

      const response = await request(app.getHttpServer())
        .patch(`/api/tasks/${created.id}`)
        .set(workspaceHeaders(primary))
        .send({ status: 'DONE' })
        .expect(422);

      const body = response.body as ApiErrorResponse;
      expect(body.error.code).toBe(TASK_DOMAIN_ERROR_CODES.INVALID_STATUS_TRANSITION);
    });
  });
});
