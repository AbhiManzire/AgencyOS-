import type { IntegrationSyncTrigger } from '@prisma/client';
import type { ConnectConnectionDto } from '../dto/connect-connection.dto';
import type { CreateConnectionDto } from '../dto/create-connection.dto';
import type {
  ListConnectionsQueryDto,
  ListSyncLogsQueryDto,
  ListSyncQueryDto,
  ListWebhookDeliveriesQueryDto,
} from '../dto/list-integrations-query.dto';
import type { UpdateConnectionDto } from '../dto/update-connection.dto';
import type { CreateWebhookDto, SendWebhookDto, UpdateWebhookDto } from '../dto/webhook.dto';

/** Maps HTTP DTOs to application commands — no business logic. */
export const IntegrationMapper = {
  toCreateConnectionCommand(dto: CreateConnectionDto) {
    return {
      providerKey: dto.providerKey,
      displayName: dto.displayName,
      config: dto.config,
      isEnabled: dto.isEnabled,
    };
  },

  toUpdateConnectionCommand(dto: UpdateConnectionDto) {
    return {
      displayName: dto.displayName,
      config: dto.config,
      isEnabled: dto.isEnabled,
    };
  },

  toListConnectionsQuery(dto: ListConnectionsQueryDto) {
    return {
      skip: dto.skip,
      take: dto.take,
      providerKey: dto.providerKey,
      status: dto.status,
      includeArchived: dto.includeArchived,
    };
  },

  toConnectCredentials(dto: ConnectConnectionDto): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(dto.credentials)) {
      if (typeof value === 'string') {
        result[key] = value;
      }
    }
    return result;
  },

  toListSyncQuery(dto: ListSyncQueryDto) {
    return { skip: dto.skip, take: dto.take };
  },

  toListSyncLogsQuery(dto: ListSyncLogsQueryDto) {
    return {
      skip: dto.skip,
      take: dto.take,
      connectionId: dto.connectionId,
    };
  },

  toCreateWebhookCommand(dto: CreateWebhookDto) {
    return {
      direction: dto.direction,
      name: dto.name,
      endpointPath: dto.endpointPath,
      targetUrl: dto.targetUrl,
      secret: dto.secret,
      signatureHeader: dto.signatureHeader,
      isActive: dto.isActive,
      config: dto.config,
    };
  },

  toUpdateWebhookCommand(dto: UpdateWebhookDto) {
    return {
      name: dto.name,
      endpointPath: dto.endpointPath,
      targetUrl: dto.targetUrl,
      secret: dto.secret,
      signatureHeader: dto.signatureHeader,
      isActive: dto.isActive,
      config: dto.config,
    };
  },

  toSendWebhookPayload(dto: SendWebhookDto): unknown {
    return dto.payload ?? {};
  },

  toListWebhookDeliveriesQuery(dto: ListWebhookDeliveriesQueryDto) {
    return {
      skip: dto.skip,
      take: dto.take,
      webhookId: dto.webhookId,
    };
  },

  defaultManualTrigger(): IntegrationSyncTrigger {
    return 'MANUAL';
  },
};
