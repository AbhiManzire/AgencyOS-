import type { HealthCheckResponse } from '@agencyos/shared';
import './setup-e2e';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { createE2eApp } from './helpers/create-e2e-app';

describe('Health (e2e)', () => {
  let app!: INestApplication<App>;

  beforeAll(async () => {
    app = await createE2eApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health returns health status', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect((response: { body: HealthCheckResponse }) => {
        expect(response.body.service).toBe('agencyos-api');
        expect(['ok', 'error']).toContain(response.body.checks.database);
      });
  });

  it('GET /api/auth/me requires authentication', () => {
    return request(app.getHttpServer()).get('/api/auth/me').expect(401);
  });
});
