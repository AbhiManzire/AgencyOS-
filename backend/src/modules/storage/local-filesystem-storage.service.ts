import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type {
  LocalStorageService,
  SaveStorageObjectParams,
} from './local-storage.service.interface';

@Injectable()
export class LocalFilesystemStorageService implements LocalStorageService {
  private readonly rootPath: string;

  constructor(private readonly configService: ConfigService) {
    this.rootPath = path.resolve(this.configService.get<string>('storage.localPath', 'uploads'));
  }

  async save(params: SaveStorageObjectParams): Promise<void> {
    const absolutePath = this.resolveAbsolutePath(params.storageKey);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, params.buffer);
  }

  async read(storageKey: string): Promise<Buffer> {
    return readFile(this.resolveAbsolutePath(storageKey));
  }

  async delete(storageKey: string): Promise<void> {
    const absolutePath = this.resolveAbsolutePath(storageKey);
    await rm(absolutePath, { force: true });
  }

  private resolveAbsolutePath(storageKey: string): string {
    const normalizedKey = storageKey.replace(/\\/g, '/');
    const absolutePath = path.resolve(this.rootPath, normalizedKey);

    if (!absolutePath.startsWith(this.rootPath)) {
      throw new Error('Invalid storage key.');
    }

    return absolutePath;
  }
}
