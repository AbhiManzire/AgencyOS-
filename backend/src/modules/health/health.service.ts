import { Injectable } from '@nestjs/common';
import {
  HealthCheckResponse,
  HealthStatus,
  LivenessResponse,
  ReadinessResponse,
} from '@agencyos/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthCheckResponse> {
    const readiness = await this.readiness();
    const databaseStatus = readiness.checks.database;

    return {
      status: readiness.status,
      timestamp: readiness.timestamp,
      service: readiness.service,
      version: process.env.npm_package_version ?? '0.1.0',
      checks: {
        database: databaseStatus,
      },
    };
  }

  liveness(): LivenessResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'agencyos-api',
    };
  }

  async readiness(): Promise<ReadinessResponse> {
    const databaseHealthy = await this.prisma.isHealthy();
    const databaseStatus: HealthStatus = databaseHealthy ? 'ok' : 'error';
    const overallStatus: HealthStatus = databaseHealthy ? 'ok' : 'degraded';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      service: 'agencyos-api',
      checks: {
        database: databaseStatus,
      },
    };
  }
}
