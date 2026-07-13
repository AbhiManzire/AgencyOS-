import { Injectable } from '@nestjs/common';
import type { File as PrismaFile, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateFileData,
  FileEntityScope,
  FileRecord,
  FileRepository,
  FileScope,
} from './file.repository.interface';

type FileWithUploader = PrismaFile & {
  uploadedByUser: Pick<User, 'displayName' | 'email' | 'firstName' | 'lastName'>;
};

@Injectable()
export class PrismaFileRepository implements FileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateFileData): Promise<FileRecord> {
    const file = await this.prisma.file.create({
      data: {
        ...data,
        size: BigInt(data.size),
      },
      include: uploaderInclude,
    });

    return toFileRecord(file);
  }

  async findById(scope: FileScope, id: string): Promise<FileRecord | null> {
    const file = await this.prisma.file.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
      },
      include: uploaderInclude,
    });

    return file ? toFileRecord(file) : null;
  }

  async listByEntity(scope: FileEntityScope): Promise<readonly FileRecord[]> {
    const files = await this.prisma.file.findMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        entityType: scope.entityType,
        entityId: scope.entityId,
      },
      include: uploaderInclude,
      orderBy: { createdAt: 'desc' },
    });

    return files.map(toFileRecord);
  }

  async delete(scope: FileScope, id: string): Promise<FileRecord | null> {
    const existing = await this.findById(scope, id);
    if (existing === null) {
      return null;
    }

    await this.prisma.file.delete({
      where: { id },
    });

    return existing;
  }
}

const uploaderInclude = {
  uploadedByUser: {
    select: {
      displayName: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  },
} as const;

function resolveUserDisplayName(
  user: Pick<User, 'displayName' | 'email' | 'firstName' | 'lastName'>,
): string {
  if (user.displayName !== null && user.displayName.trim().length > 0) {
    return user.displayName.trim();
  }

  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return name.length > 0 ? name : user.email;
}

function toFileRecord(file: FileWithUploader): FileRecord {
  return {
    id: file.id,
    tenantId: file.tenantId,
    workspaceId: file.workspaceId,
    entityType: file.entityType,
    entityId: file.entityId,
    folder: file.folder,
    fileName: file.fileName,
    originalName: file.originalName,
    mimeType: file.mimeType,
    extension: file.extension,
    size: Number(file.size),
    storageKey: file.storageKey,
    uploadedByUserId: file.uploadedByUserId,
    uploaderDisplayName: resolveUserDisplayName(file.uploadedByUser),
    uploaderEmail: file.uploadedByUser.email,
    createdAt: file.createdAt,
  };
}
