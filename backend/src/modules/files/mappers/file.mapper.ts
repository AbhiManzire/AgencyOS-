import type { UploadFileDto } from '../dto/upload-file.dto';
import type { UploadFileCommand } from '../services/file-application.types';
import type { UploadedFilePayload } from '../types/uploaded-file.types';

export const FileMapper = {
  toUploadFileCommand(dto: UploadFileDto, file: UploadedFilePayload): UploadFileCommand {
    return {
      entityType: dto.entityType,
      entityId: dto.entityId,
      originalName: file.originalname,
      mimeType: file.mimetype,
      buffer: file.buffer,
    };
  },
};
