import { Test, TestingModule } from '@nestjs/testing';
import { HealthStatus } from '@agencyos/shared';
import { PrismaService } from '../prisma/prisma.service';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  let prisma: { isHealthy: jest.Mock };

  beforeEach(async () => {
    prisma = { isHealthy: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [HealthService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(HealthService);
  });

  it('returns ok when database is healthy', async () => {
    prisma.isHealthy.mockResolvedValue(true);

    const result = await service.check();

    expect(result.status).toBe('ok' satisfies HealthStatus);
    expect(result.checks.database).toBe('ok');
    expect(result.service).toBe('agencyos-api');
  });

  it('returns degraded when database is unavailable', async () => {
    prisma.isHealthy.mockResolvedValue(false);

    const result = await service.check();

    expect(result.status).toBe('degraded');
    expect(result.checks.database).toBe('error');
  });
});
