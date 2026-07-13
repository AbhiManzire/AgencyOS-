'use client';

import { useMemo, useState } from 'react';
import { NativeSelect } from '@/components/ui/native-select';
import { FilePanel } from '@/features/files/components/file-panel';
import type { ClientDocumentFolder } from '@/features/clients/success/api/client-success.types';
import {
  CLIENT_DOCUMENT_FOLDER_LABELS,
  CLIENT_DOCUMENT_FOLDERS,
} from '@/features/clients/success/api/client-success.types';

interface ClientDocumentsTabProps {
  readonly clientId: string;
}

export function ClientDocumentsTab({ clientId }: ClientDocumentsTabProps) {
  const [folderFilter, setFolderFilter] = useState<ClientDocumentFolder | 'ALL'>('ALL');
  const [uploadFolder, setUploadFolder] = useState<ClientDocumentFolder>('OTHER');

  const filterFolder = useMemo(
    () => (folderFilter === 'ALL' ? undefined : folderFilter),
    [folderFilter],
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="document-folder-filter" className="text-sm font-medium">
            Filter folder
          </label>
          <NativeSelect
            id="document-folder-filter"
            label="Filter folder"
            value={folderFilter}
            onChange={(event) => {
              setFolderFilter(event.target.value as ClientDocumentFolder | 'ALL');
            }}
          >
            <option value="ALL">All folders</option>
            {CLIENT_DOCUMENT_FOLDERS.map((folder) => (
              <option key={folder} value={folder}>
                {CLIENT_DOCUMENT_FOLDER_LABELS[folder]}
              </option>
            ))}
          </NativeSelect>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="document-upload-folder" className="text-sm font-medium">
            Upload folder
          </label>
          <NativeSelect
            id="document-upload-folder"
            label="Upload folder"
            value={uploadFolder}
            onChange={(event) => {
              setUploadFolder(event.target.value as ClientDocumentFolder);
            }}
          >
            {CLIENT_DOCUMENT_FOLDERS.map((folder) => (
              <option key={folder} value={folder}>
                {CLIENT_DOCUMENT_FOLDER_LABELS[folder]}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

      <FilePanel
        entityType="client"
        entityId={clientId}
        folder={uploadFolder}
        filterFolder={filterFolder}
      />
    </div>
  );
}
