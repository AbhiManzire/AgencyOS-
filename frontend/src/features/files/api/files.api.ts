import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  EntityFilesParams,
  FileRecord,
  UploadFileParams,
} from '@/features/files/api/file.types';

/** Fetches files for an entity. */
export async function listFiles(params: EntityFilesParams): Promise<readonly FileRecord[]> {
  const response = await apiClient.get<ApiSuccessResponse<readonly FileRecord[]>>(
    `/files/${params.entityType}/${params.entityId}`,
  );
  return response.data.data;
}

/** Uploads a file and attaches it to an entity. */
export async function uploadFile(params: UploadFileParams): Promise<FileRecord> {
  const formData = new FormData();
  formData.append('file', params.file);
  formData.append('entityType', params.entityType);
  formData.append('entityId', params.entityId);

  const response = await apiClient.post<ApiSuccessResponse<FileRecord>>('/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.data;
}

/** Deletes a file by id. */
export async function deleteFile(fileId: string): Promise<FileRecord> {
  const response = await apiClient.delete<ApiSuccessResponse<FileRecord>>(`/files/${fileId}`);
  return response.data.data;
}

/** Downloads a file by id and triggers a browser save. */
export async function downloadFile(fileId: string, originalName: string): Promise<void> {
  const response = await apiClient.get<ArrayBuffer>(`/files/${fileId}/download`, {
    responseType: 'arraybuffer',
  });

  const contentType = response.headers['content-type'];
  const mimeType = typeof contentType === 'string' ? contentType : 'application/octet-stream';

  const blob = new Blob([response.data], {
    type: mimeType,
  });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = originalName;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}
