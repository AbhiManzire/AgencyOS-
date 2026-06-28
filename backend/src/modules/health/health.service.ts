import { Injectable } from '@nestjs/common';
import { HealthCheckResponse, HealthStatus } from '@agencyos/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthCheckResponse> {
    const databaseHealthy = await this.prisma.isHealthy();
    const databaseStatus: HealthStatus = databaseHealthy ? 'ok' : 'error';
    const overallStatus: HealthStatus = databaseHealthy ? 'ok' : 'degraded';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      service: 'agencyos-api',
      version: process.env.npm_package_version ?? '0.1.0',
      checks: {
        database: databaseStatus,
      },
    };
  }
}
