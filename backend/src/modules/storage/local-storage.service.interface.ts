export const LOCAL_STORAGE_SERVICE = Symbol('LOCAL_STORAGE_SERVICE');

export interface SaveStorageObjectParams {
  readonly storageKey: string;
  readonly buffer: Buffer;
}

/** Replaceable local filesystem storage adapter. */
export interface LocalStorageService {
  save(params: SaveStorageObjectParams): Promise<void>;
  read(storageKey: string): Promise<Buffer>;
  delete(storageKey: string): Promise<void>;
}
