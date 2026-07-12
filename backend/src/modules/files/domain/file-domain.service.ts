import { FILE_DOMAIN_ERROR_CODES, FileDomainError } from './file-domain.errors';
import type { UploadFileValidationInput } from './file-domain.types';

export class FileDomainService {
  validateUpload(input: UploadFileValidationInput): void {
    if (input.buffer === undefined || input.buffer.length === 0) {
      throw new FileDomainError(
        FILE_DOMAIN_ERROR_CODES.FILE_REQUIRED,
        'A file is required for upload.',
      );
    }

    if (input.buffer.length > input.maxFileSizeBytes) {
      throw new FileDomainError(
        FILE_DOMAIN_ERROR_CODES.FILE_TOO_LARGE,
        'File exceeds the maximum allowed size.',
      );
    }

    const mimeType = input.mimeType?.trim().toLowerCase() ?? '';
    const allowedMimeTypes = input.allowedMimeTypes;
    if (allowedMimeTypes !== undefined && allowedMimeTypes.length > 0) {
      const allowed = allowedMimeTypes.map((value) => value.trim().toLowerCase());
      if (!allowed.includes(mimeType)) {
        throw new FileDomainError(
          FILE_DOMAIN_ERROR_CODES.FILE_TYPE_NOT_ALLOWED,
          'File MIME type is not allowed.',
        );
      }
    }

    const allowedExtensions = input.allowedExtensions;
    if (allowedExtensions !== undefined && allowedExtensions.length > 0) {
      const extension = this.extractExtension(input.originalName ?? '');
      const allowed = allowedExtensions.map((value) => value.trim().toLowerCase());
      if (!allowed.includes(extension)) {
        throw new FileDomainError(
          FILE_DOMAIN_ERROR_CODES.FILE_TYPE_NOT_ALLOWED,
          'File extension is not allowed.',
        );
      }
    }
  }

  extractExtension(originalName: string): string {
    const trimmed = originalName.trim();
    const lastDot = trimmed.lastIndexOf('.');

    if (lastDot <= 0 || lastDot === trimmed.length - 1) {
      return '';
    }

    return trimmed.slice(lastDot + 1).toLowerCase();
  }

  buildStoredFileName(fileId: string, extension: string): string {
    return extension.length > 0 ? `${fileId}.${extension}` : fileId;
  }

  buildStorageKey(params: {
    tenantId: string;
    workspaceId: string;
    entityType: string;
    entityId: string;
    fileName: string;
  }): string {
    return [
      params.tenantId,
      params.workspaceId,
      params.entityType,
      params.entityId,
      params.fileName,
    ].join('/');
  }
}
