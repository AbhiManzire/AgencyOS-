import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { IntegrationScope } from '../domain/integration-domain.types';
import { CredentialCryptoService } from './credential-crypto.service';

@Injectable()
export class CredentialStoreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CredentialCryptoService,
  ) {}

  async upsertCredentials(
    scope: IntegrationScope,
    connectionId: string,
    credentials: Record<string, string>,
    actorUserId: string | null,
  ): Promise<void> {
    const encrypted = this.crypto.encryptJson(credentials);
    const now = new Date();

    await this.prisma.integrationCredential.upsert({
      where: { connectionId },
      create: {
        id: randomUUID(),
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        connectionId,
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        keyVersion: encrypted.keyVersion,
        metadata: {},
        createdAt: now,
        updatedAt: now,
        createdByUserId: actorUserId,
        updatedByUserId: actorUserId,
      },
      update: {
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        keyVersion: encrypted.keyVersion,
        updatedAt: now,
        updatedByUserId: actorUserId,
      },
    });
  }

  async readCredentials(connectionId: string): Promise<Record<string, string>> {
    const row = await this.prisma.integrationCredential.findUnique({
      where: { connectionId },
    });
    if (row === null) {
      return {};
    }
    return this.crypto.decryptJson({
      ciphertext: row.ciphertext,
      iv: row.iv,
      authTag: row.authTag,
      keyVersion: row.keyVersion,
    });
  }

  async clearCredentials(connectionId: string): Promise<void> {
    await this.prisma.integrationCredential.deleteMany({
      where: { connectionId },
    });
  }

  async hasCredentials(connectionId: string): Promise<boolean> {
    const row = await this.prisma.integrationCredential.findUnique({
      where: { connectionId },
      select: { id: true },
    });
    return row !== null;
  }

  async updateMetadata(connectionId: string, metadata: Prisma.InputJsonValue): Promise<void> {
    await this.prisma.integrationCredential.updateMany({
      where: { connectionId },
      data: {
        metadata,
        updatedAt: new Date(),
      },
    });
  }
}
