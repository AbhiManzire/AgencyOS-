import { Injectable } from '@nestjs/common';
import { IntegrationConnectionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  IntegrationHealthDashboard,
  IntegrationScope,
} from '../domain/integration-domain.types';

@Injectable()
export class IntegrationHealthService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(scope: IntegrationScope): Promise<IntegrationHealthDashboard> {
    const connections = await this.prisma.integrationConnection.findMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
      },
      select: {
        id: true,
        providerKey: true,
        displayName: true,
        status: true,
        rateLimitInfo: true,
      },
    });

    let connected = 0;
    let disconnected = 0;
    let failed = 0;
    let pending = 0;

    for (const connection of connections) {
      switch (connection.status) {
        case IntegrationConnectionStatus.CONNECTED:
          connected += 1;
          break;
        case IntegrationConnectionStatus.DISCONNECTED:
          disconnected += 1;
          break;
        case IntegrationConnectionStatus.ERROR:
          failed += 1;
          break;
        case IntegrationConnectionStatus.PENDING:
          pending += 1;
          break;
        default:
          break;
      }
    }

    const rateLimitSummaries = connections
      .filter((connection) => connection.rateLimitInfo !== null)
      .map((connection) => ({
        connectionId: connection.id,
        providerKey: connection.providerKey,
        displayName: connection.displayName,
        rateLimitInfo: connection.rateLimitInfo,
      }));

    return {
      connected,
      disconnected,
      failed,
      pending,
      total: connections.length,
      rateLimitSummaries,
    };
  }
}
